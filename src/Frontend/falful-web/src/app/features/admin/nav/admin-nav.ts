import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavItem, CreateAdminNavItemRequest, UpdateAdminNavItemRequest } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe],
  styleUrls: ['../admin-shared.scss', './admin-nav.scss'],
  templateUrl: './admin-nav.html'
})
export class AdminNavComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast        = inject(ToastService);

  items   = signal<AdminNavItem[]>([]);
  loading = signal(true);
  editing = signal<AdminNavItem | null>(null);
  saving  = signal(false);
  saveError = signal('');

  showCreate   = signal(false);
  creatingItem = signal(false);
  createError  = signal('');
  deleteTarget = signal<AdminNavItem | null>(null);

  /** Distinct portal types derived from all Roles.PortalType values.
   *  Grows automatically as new roles with new portal types are created. */
  private readonly allRoles = signal<{portalType: string; name: string}[]>([]);
  readonly portalTypes = computed(() =>
    [...new Set(this.allRoles().map(r => r.portalType))].sort()
  );

  createForm: CreateAdminNavItemRequest = this.blankCreateForm();

  editForm: UpdateAdminNavItemRequest & { id: number } = this.emptyForm();

  ngOnInit(): void {
    this.adminService.getAllAdminNav().subscribe({
      next: items => { this.items.set(items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.adminService.getRoles().subscribe({
      next: roles => this.allRoles.set(roles),
      error: () => {}
    });
  }

  startEdit(item: AdminNavItem): void {
    this.editing.set(item);
    this.saveError.set('');
    this.editPortals = this.parsePortals(item.portalScope);
    this.editForm = {
      id: item.id,
      label: item.label,
      icon: item.icon ?? '',
      groupLabel: item.groupLabel ?? '',
      displayOrder: item.displayOrder,
      isVisible: item.isVisible,
      requiredPermission: item.requiredPermission ?? '',
      portalScope: item.portalScope ?? ''
    };
  }

  cancelEdit(): void { this.editing.set(null); }

  save(item: AdminNavItem): void {
    if (!this.editForm.label.trim()) { this.saveError.set('Label is required.'); return; }
    this.saving.set(true);
    this.saveError.set('');
    const dto: UpdateAdminNavItemRequest = {
      label:              this.editForm.label.trim(),
      icon:               this.editForm.icon || undefined,
      groupLabel:         this.editForm.groupLabel || undefined,
      displayOrder:       this.editForm.displayOrder,
      isVisible:          this.editForm.isVisible,
      requiredPermission: this.editForm.requiredPermission || undefined,
      portalScope:        this.stringifyPortals(this.editPortals)
    };
    this.adminService.updateAdminNavItem(item.id, dto).subscribe({
      next: () => {
        this.items.update(list => list.map(i => i.id === item.id ? { ...i, ...dto } : i));
        this.saving.set(false);
        this.editing.set(null);
      },
      error: () => { this.saving.set(false); this.saveError.set('Failed to save. Please try again.'); }
    });
  }

  toggleVisible(item: AdminNavItem): void {
    const dto: UpdateAdminNavItemRequest = {
      label:              item.label,
      icon:               item.icon,
      groupLabel:         item.groupLabel,
      displayOrder:       item.displayOrder,
      isVisible:          !item.isVisible,
      requiredPermission: item.requiredPermission,
      portalScope:        item.portalScope ?? undefined
    };
    this.adminService.updateAdminNavItem(item.id, dto).subscribe({
      next: () => this.items.update(list => list.map(i => i.id === item.id ? { ...i, isVisible: !i.isVisible } : i))
    });
  }

  private emptyForm() {
    return { id: 0, label: '', icon: '', groupLabel: '', displayOrder: 0, isVisible: true, requiredPermission: '', portalScope: '' };
  }

  openCreate(): void {
    this.createForm = this.blankCreateForm();
    this.createPortals = new Set(['admin']); // default: admin only
    this.createError.set('');
    this.showCreate.set(true);
  }

  saveCreate(): void {
    if (!this.createForm.label.trim()) { this.createError.set('Label is required.'); return; }
    if (!this.createForm.route.trim()) { this.createError.set('Route is required.'); return; }
    this.creatingItem.set(true);
    this.adminService.createAdminNavItem({
      ...this.createForm,
      label:       this.createForm.label.trim(),
      route:       this.createForm.route.trim(),
      portalScope: this.stringifyPortals(this.createPortals) ?? 'admin'
    }).subscribe({
      next: () => {
        this.toast.success('Nav item created.');
        this.creatingItem.set(false);
        this.showCreate.set(false);
        this.reload();
      },
      error: (e: { error?: { message?: string } }) => {
        this.createError.set(e?.error?.message ?? 'Failed to create item.');
        this.creatingItem.set(false);
      }
    });
  }

  confirmDelete(item: AdminNavItem): void { this.deleteTarget.set(item); }

  doDelete(): void {
    const item = this.deleteTarget();
    if (!item) return;
    this.saving.set(true);
    this.adminService.deleteAdminNavItem(item.id).subscribe({
      next: () => {
        this.toast.success('Nav item deleted.');
        this.saving.set(false);
        this.deleteTarget.set(null);
        this.reload();
      },
      error: (e: { error?: { message?: string } }) => {
        this.toast.error(e?.error?.message ?? 'Failed to delete item.');
        this.saving.set(false);
        this.deleteTarget.set(null);
      }
    });
  }

  private reload(): void {
    this.adminService.getAllAdminNav().subscribe({
      next: items => this.items.set(items),
      error: () => {}
    });
  }

  /** Parses a comma-separated PortalScope string into a Set of portal names. */
  private parsePortals(scope?: string | null): Set<string> {
    if (!scope) return new Set();
    return new Set(scope.split(',').map(p => p.trim()).filter(Boolean));
  }

  /** Converts the Set back to a comma-separated string (or undefined for "all portals"). */
  private stringifyPortals(portals: Set<string>): string | undefined {
    if (portals.size === 0) return undefined;
    return [...portals].sort().join(',');
  }

  // ── Per-item portal selection (edit form) ─────────────────────────────────
  editPortals = new Set<string>();

  toggleEditPortal(portal: string): void {
    if (this.editPortals.has(portal)) this.editPortals.delete(portal);
    else this.editPortals.add(portal);
    this.editPortals = new Set(this.editPortals); // trigger Angular change detection
  }

  // ── Per-item portal selection (create form) ───────────────────────────────
  createPortals = new Set<string>(['admin']);

  toggleCreatePortal(portal: string): void {
    if (this.createPortals.has(portal)) this.createPortals.delete(portal);
    else this.createPortals.add(portal);
    this.createPortals = new Set(this.createPortals);
  }

  portalScopeLabel(scope?: string | null): string {
    if (!scope) return 'all portals';
    const portals = scope.split(',').map(p => p.trim()).filter(Boolean);
    if (portals.length === 0) return 'all portals';
    return portals.join(' + ');
  }

  portalScopeClass(scope?: string | null): string {
    if (!scope) return 'scope-all';
    const portals = scope.split(',').map(p => p.trim()).filter(Boolean);
    if (portals.includes('admin') && portals.includes('rider')) return 'scope-both';
    if (portals.includes('admin')) return 'scope-admin';
    if (portals.includes('rider')) return 'scope-rider';
    return 'scope-all';
  }

  private blankCreateForm(): CreateAdminNavItemRequest {
    return { label: '', route: '/admin/', icon: '', groupLabel: '', displayOrder: 0, isVisible: true, requiredPermission: '', portalScope: 'admin' };
  }
}
