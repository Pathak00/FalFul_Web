import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MenuItem } from '../../../core/models/cms.models';
import { AdminService } from '../../../core/services/admin.service';
import { CmsService } from '../../../core/services/cms.service';

interface RoleOption {
  id: number;
  name: string;
}

const BASE_OPTIONS = [
  { value: 0, label: 'Everyone', desc: 'All visitors, including guests not logged in' },
  { value: 1, label: 'Logged-in users', desc: 'Any authenticated user regardless of role' },
  {
    value: 2,
    label: 'Guests only',
    desc: 'Only visitors who are NOT logged in (e.g. Login, Register links)',
  },
  {
    value: 3,
    label: 'Specific roles',
    desc: 'Only users whose role is one of the selected roles below',
  },
];

@Component({
  selector: 'app-admin-menus',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-menus.html',
  styleUrl: './admin-menus.scss',
})
export class AdminMenusComponent implements OnInit {
  private cms = inject(CmsService);
  private adminSvc = inject(AdminService);

  allItems = signal<MenuItem[]>([]);
  roles = signal<RoleOption[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal(false);
  saving = signal(false);
  error = signal('');
  deleteTarget = signal<MenuItem | null>(null);

  baseOptions = BASE_OPTIONS;

  form: {
    id?: number;
    parentId?: number;
    label: string;
    url: string;
    icon: string;
    displayOrder: number;
    isVisible: boolean;
    visibleTo: number;
    requiredRoleIds: number[];
    openInNewTab: boolean;
  } = this.emptyForm();

  publicTopLevel = () => this.allItems().filter((i) => !i.parentId && !i.isPortalShortcut);
  portalShortcuts = () => this.allItems().filter((i) => !i.parentId && i.isPortalShortcut);
  topLevel = () => this.allItems().filter((i) => !i.parentId);
  childrenOf = (pid: number) => this.allItems().filter((i) => i.parentId === pid);
  parentLabel = () => this.allItems().find((i) => i.id === this.form.parentId)?.label ?? '';

  visibilityLabel(item: MenuItem): string {
    if (item.visibleTo === 3) {
      if (!item.requiredRoleIds?.length) return 'Specific roles (none)';
      const names = item.requiredRoleIds
        .map((id) => this.roles().find((r) => r.id === id)?.name ?? `#${id}`)
        .join(', ');
      return names;
    }
    return BASE_OPTIONS.find((o) => o.value === item.visibleTo)?.label ?? String(item.visibleTo);
  }

  toggleRole(roleId: number): void {
    const ids = this.form.requiredRoleIds;
    const idx = ids.indexOf(roleId);
    this.form.requiredRoleIds = idx === -1 ? [...ids, roleId] : ids.filter((i) => i !== roleId);
  }

  ngOnInit(): void {
    this.adminSvc.getRoles().subscribe({
      next: (r) => this.roles.set(r.map((x) => ({ id: x.id, name: x.name }))),
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.cms.getAllMenuItems().subscribe({
      next: (items) => {
        this.allItems.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreate(parentId?: number): void {
    this.form = this.emptyForm();
    if (parentId) this.form.parentId = parentId;
    this.editing.set(false);
    this.error.set('');
    this.showForm.set(true);
  }

  openEdit(item: MenuItem): void {
    this.form = {
      id: item.id,
      parentId: item.parentId,
      label: item.label,
      url: item.url ?? '',
      icon: item.icon ?? '',
      displayOrder: item.displayOrder,
      isVisible: item.isVisible,
      visibleTo: item.visibleTo,
      requiredRoleIds: [...(item.requiredRoleIds ?? [])],
      openInNewTab: item.openInNewTab,
    };
    this.editing.set(true);
    this.error.set('');
    this.showForm.set(true);
  }

  save(): void {
    if (!this.form.label.trim()) {
      this.error.set('Label is required.');
      return;
    }
    this.saving.set(true);

    const dto = {
      parentId: this.form.parentId || undefined,
      label: this.form.label,
      url: this.form.url || undefined,
      icon: this.form.icon || undefined,
      displayOrder: this.form.displayOrder,
      isVisible: this.form.isVisible,
      visibleTo: +this.form.visibleTo,
      requiredRoleIds: +this.form.visibleTo === 3 ? this.form.requiredRoleIds : [],
      openInNewTab: this.form.openInNewTab,
    };

    const obs: Observable<unknown> = this.editing()
      ? this.cms.updateMenuItem({ ...dto, id: this.form.id! })
      : this.cms.createMenuItem(dto);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.load();
      },
      error: (e: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.error.set(e.error?.message ?? 'Failed to save.');
      },
    });
  }

  confirmDelete(): void {
    if (!this.deleteTarget()) return;
    this.cms.deleteMenuItem(this.deleteTarget()!.id).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.load();
      },
    });
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  private emptyForm() {
    return {
      label: '',
      url: '',
      icon: '',
      displayOrder: 0,
      isVisible: true,
      visibleTo: 0,
      requiredRoleIds: [] as number[],
      openInNewTab: false,
    };
  }
}
