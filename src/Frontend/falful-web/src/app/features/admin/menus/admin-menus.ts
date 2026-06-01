import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MenuItem } from '../../../core/models/cms.models';
import { AdminService } from '../../../core/services/admin.service';
import { CmsService } from '../../../core/services/cms.service';

interface RoleOption { id: number; name: string; }

const BASE_OPTIONS = [
  { value: 0, label: 'Everyone',        desc: 'All visitors, including guests not logged in' },
  { value: 1, label: 'Logged-in users', desc: 'Any authenticated user regardless of role' },
  { value: 2, label: 'Guests only',     desc: 'Only visitors who are NOT logged in (e.g. Login, Register links)' },
  { value: 3, label: 'Specific roles',  desc: 'Only users whose role is one of the selected roles below' },
];

@Component({
  selector: 'app-admin-menus',
  standalone: true,
  imports: [FormsModule],
  styleUrl: '../admin-shared.scss',
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Navigation Menus</h1>
          <p class="page-sub">Build the public website navigation. Create top-level links and nest items under them to make dropdowns. Control who sees each link using the "Visible To" setting.</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">+ Add Menu Item</button>
      </div>

      @if (loading()) {
        <div class="empty-state"><div class="spinner"></div><p>Loading…</p></div>
      } @else {
        <!-- Public navigation items -->
        <div class="menu-tree">
          @for (item of publicTopLevel(); track item.id) {
            <div class="menu-row menu-row-top" [class.row-hidden]="!item.isVisible">
              <div class="menu-row-left">
                @if (item.icon) {
                  @if (item.icon.startsWith('bi-')) { <i class="bi {{ item.icon }} menu-icon"></i> }
                  @else { <span class="menu-icon">{{ item.icon }}</span> }
                }
                <div class="menu-label-block">
                  <strong>{{ item.label }}</strong>
                  @if (item.url) { <span class="menu-url">{{ item.url }}</span> }
                </div>
                <span class="badge badge-blue">{{ visibilityLabel(item) }}</span>
                @if (!item.isVisible) { <span class="badge badge-gray">Hidden</span> }
                <span class="order-badge">#{{ item.displayOrder }}</span>
              </div>
              <div class="menu-row-actions">
                <button class="btn-sm btn-success-soft" (click)="openCreate(item.id)">+ Sub-item</button>
                <button class="btn-sm btn-edit" (click)="openEdit(item)">Edit</button>
                <button class="btn-sm btn-danger" (click)="deleteTarget.set(item)">Delete</button>
              </div>
            </div>

            @for (child of childrenOf(item.id); track child.id) {
              <div class="menu-row menu-row-child" [class.row-hidden]="!child.isVisible">
                <div class="menu-row-left">
                  <span class="child-indent">↳</span>
                  @if (child.icon) {
                    @if (child.icon.startsWith('bi-')) { <i class="bi {{ child.icon }} menu-icon"></i> }
                    @else { <span class="menu-icon">{{ child.icon }}</span> }
                  }
                  <div class="menu-label-block">
                    <strong>{{ child.label }}</strong>
                    @if (child.url) { <span class="menu-url">{{ child.url }}</span> }
                  </div>
                  <span class="badge badge-blue">{{ visibilityLabel(child) }}</span>
                  @if (!child.isVisible) { <span class="badge badge-gray">Hidden</span> }
                  <span class="order-badge">#{{ child.displayOrder }}</span>
                </div>
                <div class="menu-row-actions">
                  <button class="btn-sm btn-edit" (click)="openEdit(child)">Edit</button>
                  <button class="btn-sm btn-danger" (click)="deleteTarget.set(child)">Delete</button>
                </div>
              </div>
            }
          }

          @if (publicTopLevel().length === 0) {
            <div class="empty-state">
              <i class="bi bi-list-nested empty-icon"></i>
              <h3>No public menu items yet</h3>
              <p>Create your first navigation link above.</p>
            </div>
          }
        </div>

        <!-- Portal Shortcuts section -->
        @if (portalShortcuts().length > 0) {
          <div class="section-header">
            <div>
              <h2 class="section-title"><i class="bi bi-door-open"></i> Portal Shortcuts</h2>
              <p class="section-desc">These links appear in the public navbar for role-specific users (e.g. "Dashboard" for customers, "Admin" for admin users). They link into a portal — not the public website. Visibility is controlled by role assignment, not general navigation.</p>
            </div>
          </div>
          <div class="menu-tree menu-tree-portal">
            @for (item of portalShortcuts(); track item.id) {
              <div class="menu-row menu-row-top menu-row-portal" [class.row-hidden]="!item.isVisible">
                <div class="menu-row-left">
                  <i class="bi bi-door-open-fill portal-icon"></i>
                  <div class="menu-label-block">
                    <strong>{{ item.label }}</strong>
                    @if (item.url) { <span class="menu-url">{{ item.url }}</span> }
                  </div>
                  <span class="badge badge-purple">Portal Shortcut</span>
                  <span class="badge badge-blue">{{ visibilityLabel(item) }}</span>
                  @if (!item.isVisible) { <span class="badge badge-gray">Hidden</span> }
                </div>
                <div class="menu-row-actions">
                  <button class="btn-sm btn-edit" (click)="openEdit(item)">Edit</button>
                  <button class="btn-sm btn-danger" (click)="deleteTarget.set(item)">Delete</button>
                </div>
              </div>

              @for (child of childrenOf(item.id); track child.id) {
                <div class="menu-row menu-row-child menu-row-portal" [class.row-hidden]="!child.isVisible">
                  <div class="menu-row-left">
                    <span class="child-indent">↳</span>
                    <div class="menu-label-block">
                      <strong>{{ child.label }}</strong>
                      @if (child.url) { <span class="menu-url">{{ child.url }}</span> }
                    </div>
                    <span class="badge badge-blue">{{ visibilityLabel(child) }}</span>
                  </div>
                  <div class="menu-row-actions">
                    <button class="btn-sm btn-edit" (click)="openEdit(child)">Edit</button>
                    <button class="btn-sm btn-danger" (click)="deleteTarget.set(child)">Delete</button>
                  </div>
                </div>
              }
            }
          </div>
        }
      }
    </div>

    <!-- Create / Edit Modal -->
    @if (showForm()) {
      <div class="modal-overlay" (click)="closeForm()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>{{ editing() ? 'Edit Menu Item' : 'New Menu Item' }}</h2>
              <p class="modal-sub">{{ form.parentId ? 'Adding a sub-item under "' + parentLabel() + '".' : 'Adding a top-level navigation link.' }}</p>
            </div>
            <button class="btn-close" (click)="closeForm()">✕</button>
          </div>

          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label>Label <span class="required">*</span></label>
                <input [(ngModel)]="form.label" placeholder="e.g. Products, About Us, My Orders" />
              </div>
              <div class="form-group">
                <label>Icon</label>
                <input [(ngModel)]="form.icon" placeholder="e.g. bi-house-fill, bi-cart" />
              </div>
            </div>
            <div class="form-group">
              <label>Link URL</label>
              <input [(ngModel)]="form.url" placeholder="e.g. /products, /dashboard" />
            </div>
          </div>

          <div class="form-section">
            <div class="form-group">
              <label>Parent (for sub-menus)</label>
              <select [(ngModel)]="form.parentId">
                <option [ngValue]="undefined">— Top-level item —</option>
                @for (item of topLevel(); track item.id) {
                  <option [ngValue]="item.id">{{ item.label }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Visible To</label>
              <select [(ngModel)]="form.visibleTo">
                @for (opt of baseOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }} — {{ opt.desc }}</option>
                }
              </select>
            </div>

            <!-- Role checkboxes shown only when Specific roles is selected -->
            @if (+form.visibleTo === 3) {
              <div class="role-picker">
                <p class="role-picker-label">Select which roles can see this item:</p>
                @if (roles().length === 0) {
                  <p class="text-muted" style="font-size:.8rem">No roles found. Create roles first in Roles &amp; Permissions.</p>
                }
                <div class="role-checks">
                  @for (role of roles(); track role.id) {
                    <label class="role-check-row">
                      <input type="checkbox"
                             [checked]="form.requiredRoleIds.includes(role.id)"
                             (change)="toggleRole(role.id)" />
                      <span>{{ role.name }}</span>
                    </label>
                  }
                </div>
                @if (+form.visibleTo === 3 && form.requiredRoleIds.length === 0) {
                  <p class="field-hint warn">Select at least one role, otherwise no one will see this item.</p>
                }
              </div>
            }

            <div class="form-row">
              <div class="form-group">
                <label>Display Order</label>
                <input type="number" [(ngModel)]="form.displayOrder" min="0" />
              </div>
            </div>
          </div>

          <div class="form-toggle-row">
            <label class="toggle-label" style="margin-bottom:.75rem">
              <div class="toggle" [class.on]="form.isVisible" (click)="form.isVisible = !form.isVisible">
                <div class="toggle-thumb"></div>
              </div>
              <div>
                <strong>{{ form.isVisible ? 'Visible' : 'Hidden' }}</strong>
                <span>{{ form.isVisible ? 'This link shows in the navigation' : 'This link is hidden from all users' }}</span>
              </div>
            </label>
            <label class="toggle-label">
              <div class="toggle" [class.on]="form.openInNewTab" (click)="form.openInNewTab = !form.openInNewTab">
                <div class="toggle-thumb"></div>
              </div>
              <div>
                <strong>{{ form.openInNewTab ? 'Opens in new tab' : 'Opens in same tab' }}</strong>
              </div>
            </label>
          </div>

          @if (error()) { <div class="form-error-box"><i class="bi bi-exclamation-triangle"></i> {{ error() }}</div> }

          <div class="modal-actions">
            <button class="btn-secondary" (click)="closeForm()">Cancel</button>
            <button class="btn-primary" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Saving…' : (editing() ? 'Save Changes' : 'Add Item') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirm -->
    @if (deleteTarget()) {
      <div class="modal-overlay" (click)="deleteTarget.set(null)">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <div class="confirm-icon"><i class="bi bi-trash3"></i></div>
          <h2>Delete "{{ deleteTarget()!.label }}"?</h2>
          <p>
            @if (!deleteTarget()!.parentId) { This will also delete all sub-items nested under it. }
            @else { This sub-item will be removed from the navigation. }
          </p>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="deleteTarget.set(null)">Cancel</button>
            <button class="btn-danger-solid" (click)="confirmDelete()">Yes, Delete</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-sub { color: #64748b; margin: .25rem 0 0; font-size: .875rem; }

    .menu-tree {
      background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .menu-row {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      padding: .75rem 1rem; border-bottom: 1px solid #f1f5f9;
      transition: background .1s;
      &:last-child { border-bottom: none; }
      &:hover { background: #fafafa; }
      &.row-hidden { opacity: .5; }
    }

    .menu-row-top  { background: #fafafa; }
    .menu-row-child { background: #fff; padding-left: 2rem; }
    .menu-row-left { display: flex; align-items: center; gap: .625rem; flex: 1; min-width: 0; flex-wrap: wrap; }
    .menu-row-actions { display: flex; gap: .375rem; flex-shrink: 0; }
    .menu-icon { font-size: 1rem; width: 18px; text-align: center; color: #475569; flex-shrink: 0; }
    .menu-label-block {
      display: flex; flex-direction: column; gap: .125rem;
      strong { font-size: .875rem; color: #0f172a; }
    }
    .menu-url { font-size: .75rem; color: #94a3b8; font-family: monospace; }
    .order-badge { font-size: .7rem; color: #cbd5e1; font-weight: 600; }
    .child-indent { font-size: .9rem; color: #cbd5e1; flex-shrink: 0; }
    .btn-success-soft { background: #f0fdf4; color: #16a34a; &:hover { background: #dcfce7; } }

    .section-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin: 2rem 0 .75rem;
    }
    .section-title {
      font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 .25rem;
      display: flex; align-items: center; gap: .4rem;
      i { color: #7c3aed; }
    }
    .section-desc {
      font-size: .8rem; color: #64748b; margin: 0; max-width: 680px; line-height: 1.5;
    }
    .menu-tree-portal { border-color: #e9d5ff; }
    .menu-row-portal { background: #faf5ff !important; &:hover { background: #f3e8ff !important; } }
    .portal-icon { color: #7c3aed; font-size: 1rem; flex-shrink: 0; width: 18px; text-align: center; }
    .badge-purple { background: #ede9fe; color: #7c3aed; padding: 1px 8px; border-radius: 999px; font-size: .7rem; font-weight: 700; }

    .role-picker {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: .875rem 1rem; margin-top: .5rem;
    }
    .role-picker-label { font-size: .8rem; font-weight: 600; color: #374151; margin: 0 0 .625rem; }
    .role-checks { display: flex; flex-wrap: wrap; gap: .5rem; }
    .role-check-row {
      display: flex; align-items: center; gap: .4rem; cursor: pointer;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;
      padding: .3rem .65rem; font-size: .82rem; color: #374151;
      transition: border-color .15s, background .15s;
      input { width: 14px; height: 14px; accent-color: #16a34a; cursor: pointer; }
      &:has(input:checked) { border-color: #16a34a; background: #f0fdf4; color: #15803d; font-weight: 600; }
    }
    .field-hint.warn { color: #b45309; margin-top: .375rem; }
  `]
})
export class AdminMenusComponent implements OnInit {
  private cms      = inject(CmsService);
  private adminSvc = inject(AdminService);

  allItems    = signal<MenuItem[]>([]);
  roles       = signal<RoleOption[]>([]);
  loading     = signal(true);
  showForm    = signal(false);
  editing     = signal(false);
  saving      = signal(false);
  error       = signal('');
  deleteTarget = signal<MenuItem | null>(null);

  baseOptions = BASE_OPTIONS;

  form: {
    id?: number; parentId?: number; label: string; url: string; icon: string;
    displayOrder: number; isVisible: boolean; visibleTo: number; requiredRoleIds: number[]; openInNewTab: boolean;
  } = this.emptyForm();

  publicTopLevel  = () => this.allItems().filter(i => !i.parentId && !i.isPortalShortcut);
  portalShortcuts = () => this.allItems().filter(i => !i.parentId && i.isPortalShortcut);
  topLevel        = () => this.allItems().filter(i => !i.parentId);
  childrenOf      = (pid: number) => this.allItems().filter(i => i.parentId === pid);
  parentLabel     = () => this.allItems().find(i => i.id === this.form.parentId)?.label ?? '';

  visibilityLabel(item: MenuItem): string {
    if (item.visibleTo === 3) {
      if (!item.requiredRoleIds?.length) return 'Specific roles (none)';
      const names = item.requiredRoleIds
        .map(id => this.roles().find(r => r.id === id)?.name ?? `#${id}`)
        .join(', ');
      return names;
    }
    return BASE_OPTIONS.find(o => o.value === item.visibleTo)?.label ?? String(item.visibleTo);
  }

  toggleRole(roleId: number): void {
    const ids = this.form.requiredRoleIds;
    const idx = ids.indexOf(roleId);
    this.form.requiredRoleIds = idx === -1 ? [...ids, roleId] : ids.filter(i => i !== roleId);
  }

  ngOnInit(): void {
    this.adminSvc.getRoles().subscribe({
      next: r => this.roles.set(r.map(x => ({ id: x.id, name: x.name })))
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.cms.getAllMenuItems().subscribe({
      next: items => { this.allItems.set(items); this.loading.set(false); },
      error: () => this.loading.set(false)
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
      id: item.id, parentId: item.parentId, label: item.label, url: item.url ?? '',
      icon: item.icon ?? '', displayOrder: item.displayOrder, isVisible: item.isVisible,
      visibleTo: item.visibleTo, requiredRoleIds: [...(item.requiredRoleIds ?? [])],
      openInNewTab: item.openInNewTab
    };
    this.editing.set(true);
    this.error.set('');
    this.showForm.set(true);
  }

  save(): void {
    if (!this.form.label.trim()) { this.error.set('Label is required.'); return; }
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
      openInNewTab: this.form.openInNewTab
    };

    const obs: Observable<unknown> = this.editing()
      ? this.cms.updateMenuItem({ ...dto, id: this.form.id! })
      : this.cms.createMenuItem(dto);

    obs.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.load(); },
      error: (e: { error?: { message?: string } }) => {
        this.saving.set(false);
        this.error.set(e.error?.message ?? 'Failed to save.');
      }
    });
  }

  confirmDelete(): void {
    if (!this.deleteTarget()) return;
    this.cms.deleteMenuItem(this.deleteTarget()!.id).subscribe({
      next: () => { this.deleteTarget.set(null); this.load(); }
    });
  }

  closeForm(): void { this.showForm.set(false); }

  private emptyForm() {
    return { label: '', url: '', icon: '', displayOrder: 0, isVisible: true, visibleTo: 0, requiredRoleIds: [] as number[], openInNewTab: false };
  }
}
