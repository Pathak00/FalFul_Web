import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavItem, CreateAdminNavItemRequest, UpdateAdminNavItemRequest } from '../../../core/models/admin.models';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Navigation</h1>
          <p class="page-sub">Customise the admin/rider sidebar — rename labels, change icons, reorder, or hide items. Add custom items pointing to any admin route. System items cannot be deleted.</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">
          <i class="bi bi-plus-lg"></i> New Item
        </button>
      </div>

      @if (loading()) {
        <div class="empty-state">
          <div class="spinner"></div>
          <p>Loading navigation items…</p>
        </div>
      } @else {
        <div class="nav-list">
          @for (item of items(); track item.id) {
            <div class="nav-row" [class.nav-row-hidden]="!item.isVisible">
              <div class="nav-drag-handle">
                <i class="bi bi-grip-vertical"></i>
              </div>

              <div class="nav-icon-preview">
                <i class="bi {{ item.icon }}"></i>
              </div>

              <div class="nav-row-info">
                <div class="nav-row-label">
                  @if (editing()?.id === item.id) {
                    <input class="inline-edit-input" [(ngModel)]="editForm.label" (keyup.enter)="save(item)" (keyup.escape)="cancelEdit()" />
                  } @else {
                    <span class="nav-label-text">{{ item.label }}</span>
                  }
                </div>
                <div class="nav-row-meta">
                  <span class="meta-route">{{ item.route }}</span>
                  @if (item.requiredPermission) {
                    <span class="meta-perm">{{ item.requiredPermission }}</span>
                  } @else {
                    <span class="meta-perm meta-perm-open">no permission</span>
                  }
                  <span class="meta-scope" [class]="portalScopeClass(item.portalScope)">
                    {{ portalScopeLabel(item.portalScope) }}
                  </span>
                  @if (item.groupLabel) {
                    <span class="meta-group">{{ item.groupLabel }}</span>
                  }
                </div>
              </div>

              <div class="nav-row-actions">
                @if (!item.isVisible) {
                  <span class="hidden-badge">Hidden</span>
                }

                @if (editing()?.id === item.id) {
                  <div class="edit-panel">
                    <div class="edit-row">
                      <label>Label</label>
                      <input [(ngModel)]="editForm.label" placeholder="Display label" />
                    </div>
                    <div class="edit-row">
                      <label>Icon</label>
                      <input [(ngModel)]="editForm.icon" placeholder="bi-speedometer2" />
                      @if (editForm.icon) {
                        <i class="bi {{ editForm.icon }} icon-preview"></i>
                      }
                    </div>
                    <div class="edit-row">
                      <label>Section</label>
                      <input [(ngModel)]="editForm.groupLabel" placeholder="e.g. Operations" />
                    </div>
                    <div class="edit-row">
                      <label>Order</label>
                      <input type="number" [(ngModel)]="editForm.displayOrder" style="width:80px" />
                    </div>
                    <div class="edit-row">
                      <label>
                        <input type="checkbox" [(ngModel)]="editForm.isVisible" />
                        Visible in sidebar
                      </label>
                    </div>
                    @if (saveError()) {
                      <p class="save-error">{{ saveError() }}</p>
                    }
                    <div class="edit-actions">
                      <button class="btn-primary btn-sm" (click)="save(item)" [disabled]="saving()">
                        {{ saving() ? 'Saving…' : 'Save' }}
                      </button>
                      <button class="btn-secondary btn-sm" (click)="cancelEdit()">Cancel</button>
                    </div>
                  </div>
                } @else {
                  <button class="ua-btn ua-btn-edit" (click)="startEdit(item)">
                    <i class="bi bi-pencil"></i> Edit
                  </button>
                  <button class="ua-btn" [class.ua-btn-warn]="item.isVisible" [class.ua-btn-success]="!item.isVisible"
                          (click)="toggleVisible(item)" [title]="item.isVisible ? 'Hide from sidebar' : 'Show in sidebar'">
                    <i class="bi" [class.bi-eye-slash]="item.isVisible" [class.bi-eye]="!item.isVisible"></i>
                    {{ item.isVisible ? 'Hide' : 'Show' }}
                  </button>
                  @if (!item.isSystem) {
                    <button class="ua-btn ua-btn-danger" (click)="confirmDelete(item)" title="Delete this item">
                      <i class="bi bi-trash"></i>
                    </button>
                  }
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- ── Create Nav Item modal ──────────────────────────────────────────── -->
    @if (showCreate()) {
      <div class="modal-overlay" (click)="showCreate.set(false)">
        <div class="modal-box" style="max-width:500px" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>New Navigation Item</h3>
            <button class="modal-close" (click)="showCreate.set(false)"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-group-row">
              <div class="fg">
                <label>Label *</label>
                <input [(ngModel)]="createForm.label" placeholder="e.g. Analytics" />
              </div>
              <div class="fg">
                <label>Icon</label>
                <input [(ngModel)]="createForm.icon" placeholder="bi-graph-up" />
              </div>
            </div>
            <div class="fg">
              <label>Route * <span class="hint">(must start with /admin/)</span></label>
              <input [(ngModel)]="createForm.route" placeholder="/admin/analytics" />
            </div>
            <div class="form-group-row">
              <div class="fg">
                <label>Section (Group)</label>
                <input [(ngModel)]="createForm.groupLabel" placeholder="e.g. Operations" />
              </div>
              <div class="fg">
                <label>Display Order</label>
                <input type="number" [(ngModel)]="createForm.displayOrder" min="0" />
              </div>
            </div>
            <div class="fg">
              <label>Required Permission <span class="hint">(leave blank = no permission check)</span></label>
              <input [(ngModel)]="createForm.requiredPermission" placeholder="e.g. reports" />
            </div>
            <div class="fg">
              <label>Portal Scope <span class="hint">(which portal shows this item)</span></label>
              <select [(ngModel)]="createForm.portalScope" style="border:1px solid #e2e8f0;border-radius:6px;padding:.375rem .625rem;font-size:.85rem">
                <option value="admin">Admin portal only</option>
                <option value="rider">Rider portal only</option>
                <option value="">All portals (admin + rider)</option>
              </select>
            </div>
            <label class="toggle-lbl">
              <input type="checkbox" [(ngModel)]="createForm.isVisible" />
              <span>Visible in sidebar</span>
            </label>
            @if (createError()) {
              <p class="err-msg">{{ createError() }}</p>
            }
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="showCreate.set(false)">Cancel</button>
            <button class="btn-primary" (click)="saveCreate()" [disabled]="creatingItem()">
              @if (creatingItem()) { Creating… } @else { <i class="bi bi-plus-lg"></i> Create Item }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ── Delete confirm modal ───────────────────────────────────────────── -->
    @if (deleteTarget()) {
      <div class="modal-overlay" (click)="deleteTarget.set(null)">
        <div class="modal-box modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Delete Nav Item</h3>
            <button class="modal-close" (click)="deleteTarget.set(null)"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <p>Delete <strong>"{{ deleteTarget()!.label }}"</strong>? This cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="btn-danger" (click)="doDelete()" [disabled]="saving()">
              @if (saving()) { Deleting… } @else { Delete }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-sub { color: #64748b; margin: .25rem 0 0; font-size: .875rem; }

    .nav-list { display: flex; flex-direction: column; gap: .5rem; }

    .nav-row {
      display: flex; align-items: flex-start; gap: .875rem;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: .875rem 1rem; transition: border-color .15s;
      &:hover { border-color: #cbd5e1; }
      &.nav-row-hidden { opacity: .55; }
    }

    .nav-drag-handle { color: #cbd5e1; font-size: 1.1rem; cursor: grab; padding-top: 2px; flex-shrink: 0; }

    .nav-icon-preview {
      width: 32px; height: 32px; border-radius: 7px; background: #f1f5f9;
      display: flex; align-items: center; justify-content: center;
      color: #475569; font-size: 1rem; flex-shrink: 0;
    }

    .nav-row-info { flex: 1; min-width: 0; }

    .nav-label-text { font-size: .875rem; font-weight: 600; color: #0f172a; }

    .inline-edit-input {
      font-size: .875rem; font-weight: 600; color: #0f172a;
      border: 1px solid #16a34a; border-radius: 5px; padding: .15rem .4rem;
      outline: none; width: 180px;
    }

    .nav-row-meta { display: flex; flex-wrap: wrap; gap: .3rem .625rem; margin-top: .25rem; }

    .meta-route { font-size: .72rem; color: #94a3b8; font-family: monospace; }

    .meta-perm {
      font-size: .65rem; background: #f0fdf4; color: #15803d;
      padding: 1px 6px; border-radius: 3px; font-weight: 600;
      &.meta-perm-open { background: #f1f5f9; color: #64748b; }
    }

    .meta-group {
      font-size: .65rem; background: #eff6ff; color: #1d4ed8;
      padding: 1px 6px; border-radius: 3px; font-weight: 600;
    }
    .meta-scope {
      font-size: .65rem; padding: 1px 6px; border-radius: 3px; font-weight: 600;
      &.scope-admin  { background: #fef3c7; color: #b45309; }
      &.scope-rider  { background: #dbeafe; color: #1d4ed8; }
      &.scope-all    { background: #f1f5f9; color: #64748b; }
    }

    .nav-row-actions { display: flex; flex-direction: column; gap: .375rem; align-items: flex-end; flex-shrink: 0; }

    .hidden-badge {
      font-size: .65rem; background: #f1f5f9; color: #94a3b8;
      padding: 1px 7px; border-radius: 4px; font-weight: 600;
    }

    .ua-btn {
      display: inline-flex; align-items: center; gap: .25rem;
      padding: .25rem .6rem; border-radius: 5px; font-size: .72rem; font-weight: 600;
      border: 1px solid transparent; cursor: pointer; white-space: nowrap;
      transition: all .12s; line-height: 1.4;
    }
    .ua-btn-edit    { background: #eff6ff; color: #1d4ed8; border-color: #dbeafe; &:hover { background: #dbeafe; } }
    .ua-btn-warn    { background: #fff7ed; color: #ea580c; border-color: #fed7aa; &:hover { background: #ffedd5; } }
    .ua-btn-success { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; &:hover { background: #dcfce7; } }

    .edit-panel {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: .75rem; display: flex; flex-direction: column; gap: .5rem;
      min-width: 260px; margin-top: .25rem;
    }

    .edit-row {
      display: flex; align-items: center; gap: .5rem; font-size: .8rem; color: #374151;
      label { min-width: 56px; font-weight: 600; font-size: .75rem; color: #64748b; }
      input[type="text"], input[type="number"], input:not([type="checkbox"]) {
        flex: 1; border: 1px solid #e2e8f0; border-radius: 5px;
        padding: .25rem .5rem; font-size: .8rem; outline: none;
        &:focus { border-color: #16a34a; }
      }
    }

    .icon-preview { font-size: 1rem; color: #475569; }

    .save-error { font-size: .75rem; color: #dc2626; margin: 0; }

    .edit-actions { display: flex; gap: .375rem; }

    .btn-sm { padding: .3rem .75rem; font-size: .78rem; border-radius: 6px; cursor: pointer; font-weight: 600; border: none; }
    .btn-primary  { background: #16a34a; color: #fff; &:hover:not(:disabled) { background: #15803d; } &:disabled { opacity: .6; cursor: not-allowed; } }
    .btn-secondary { background: #f1f5f9; color: #374151; border: 1px solid #e2e8f0; &:hover { background: #e2e8f0; } }
    .ua-btn-danger { background: #fef2f2; color: #dc2626; border-color: #fecaca; &:hover { background: #fee2e2; } }
    .btn-danger { background: #dc2626; color: #fff; border: none; border-radius: 6px; padding: .375rem .875rem; font-size: .82rem; font-weight: 600; cursor: pointer; &:hover:not(:disabled) { background: #b91c1c; } &:disabled { opacity: .5; cursor: not-allowed; } }

    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000; display:flex; align-items:center; justify-content:center; padding:1rem; }
    .modal-box { background:#fff; border-radius:12px; width:100%; max-width:480px; box-shadow:0 20px 60px rgba(0,0,0,.2); }
    .modal-sm { max-width:380px; }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; border-bottom:1px solid #f1f5f9; h3 { margin:0; font-size:1rem; font-weight:700; } }
    .modal-close { background:none; border:none; cursor:pointer; color:#94a3b8; font-size:.9rem; padding:.25rem; border-radius:4px; &:hover { background:#f1f5f9; } }
    .modal-body { padding:1.25rem; display:flex; flex-direction:column; gap:.75rem; p { margin:0; font-size:.875rem; color:#374151; } }
    .modal-footer { display:flex; gap:.75rem; justify-content:flex-end; padding:.875rem 1.25rem; border-top:1px solid #f1f5f9; }
    .form-group-row { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
    .fg { display:flex; flex-direction:column; gap:.3rem;
      label { font-size:.75rem; font-weight:600; color:#64748b; }
      input { border:1px solid #e2e8f0; border-radius:6px; padding:.375rem .625rem; font-size:.85rem; &:focus { outline:none; border-color:#22c55e; } }
      .hint { font-size:.7rem; color:#94a3b8; font-weight:400; }
    }
    .toggle-lbl { display:flex; align-items:center; gap:.5rem; font-size:.85rem; cursor:pointer; input { width:14px; height:14px; cursor:pointer; } }
    .err-msg { font-size:.78rem; color:#dc2626; margin:0; }
  `]
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

  createForm: CreateAdminNavItemRequest = this.blankCreateForm();

  editForm: UpdateAdminNavItemRequest & { id: number } = this.emptyForm();

  ngOnInit(): void {
    this.adminService.getAllAdminNav().subscribe({
      next: items => { this.items.set(items); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  startEdit(item: AdminNavItem): void {
    this.editing.set(item);
    this.saveError.set('');
    this.editForm = {
      id: item.id,
      label: item.label,
      icon: item.icon ?? '',
      groupLabel: item.groupLabel ?? '',
      displayOrder: item.displayOrder,
      isVisible: item.isVisible
    };
  }

  cancelEdit(): void { this.editing.set(null); }

  save(item: AdminNavItem): void {
    if (!this.editForm.label.trim()) { this.saveError.set('Label is required.'); return; }
    this.saving.set(true);
    this.saveError.set('');
    const dto: UpdateAdminNavItemRequest = {
      label:        this.editForm.label.trim(),
      icon:         this.editForm.icon || undefined,
      groupLabel:   this.editForm.groupLabel || undefined,
      displayOrder: this.editForm.displayOrder,
      isVisible:    this.editForm.isVisible
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
      label:        item.label,
      icon:         item.icon,
      groupLabel:   item.groupLabel,
      displayOrder: item.displayOrder,
      isVisible:    !item.isVisible
    };
    this.adminService.updateAdminNavItem(item.id, dto).subscribe({
      next: () => this.items.update(list => list.map(i => i.id === item.id ? { ...i, isVisible: !i.isVisible } : i))
    });
  }

  private emptyForm() {
    return { id: 0, label: '', icon: '', groupLabel: '', displayOrder: 0, isVisible: true };
  }

  openCreate(): void {
    this.createForm = this.blankCreateForm();
    this.createError.set('');
    this.showCreate.set(true);
  }

  saveCreate(): void {
    if (!this.createForm.label.trim()) { this.createError.set('Label is required.'); return; }
    if (!this.createForm.route.trim()) { this.createError.set('Route is required.'); return; }
    this.creatingItem.set(true);
    this.adminService.createAdminNavItem({
      ...this.createForm,
      label: this.createForm.label.trim(),
      route: this.createForm.route.trim()
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

  portalScopeLabel(scope?: string | null): string {
    if (!scope) return 'all portals';
    return { admin: 'admin only', rider: 'rider only' }[scope] ?? scope;
  }

  portalScopeClass(scope?: string | null): string {
    if (!scope) return 'scope-all';
    return { admin: 'scope-admin', rider: 'scope-rider' }[scope] ?? 'scope-all';
  }

  private blankCreateForm(): CreateAdminNavItemRequest {
    return { label: '', route: '/admin/', icon: '', groupLabel: '', displayOrder: 0, isVisible: true, requiredPermission: '', portalScope: 'admin' };
  }
}
