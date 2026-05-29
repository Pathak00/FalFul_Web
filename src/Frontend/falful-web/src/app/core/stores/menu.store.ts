import { Injectable, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, merge, of, skip, switchMap } from 'rxjs';
import { MenuItem } from '../models/cms.models';
import { CmsService } from '../services/cms.service';
import { AuthService } from '../services/auth.service';

export interface MenuNode extends MenuItem {
  children: MenuNode[];
}

@Injectable({ providedIn: 'root' })
export class MenuStore {
  private auth = inject(AuthService);
  private cms  = inject(CmsService);

  /**
   * merge(of(null), ...) fires the first switchMap synchronously at subscription
   * time so menus are fetched immediately — no async effect-scheduling delay.
   *
   * toObservable(isAuthenticated).pipe(skip(1)) re-triggers on every auth
   * state change (login / logout) without duplicating the initial fetch.
   */
  private raw = toSignal(
    merge(
      of(null),
      toObservable(this.auth.isAuthenticated).pipe(distinctUntilChanged(), skip(1))
    ).pipe(
      switchMap(() => this.cms.getVisibleMenuItems().pipe(catchError(() => of([] as MenuItem[]))))
    ),
    { initialValue: [] as MenuItem[] }
  );

  /** Pre-computed tree: O(n) once per fetch, O(1) reads per render cycle. */
  readonly topLevel = computed(() => buildTree(this.raw()));
}

function buildTree(items: MenuItem[]): MenuNode[] {
  const map = new Map<number, MenuNode>();

  for (const item of items) {
    map.set(item.id, { ...item, children: [] });
  }

  const roots: MenuNode[] = [];

  for (const node of map.values()) {
    if (node.parentId != null) {
      map.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  roots.sort((a, b) => a.displayOrder - b.displayOrder);
  for (const node of map.values()) {
    node.children.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  return roots;
}
