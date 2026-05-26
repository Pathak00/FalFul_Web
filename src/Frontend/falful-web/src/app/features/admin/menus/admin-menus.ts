import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MenuItem } from '../../../core/models/cms.models';
import { CmsService } from '../../../core/services/cms.service';

const VISIBLE_TO_OPTIONS = [
  { value: 0, label: 'Everyone',           desc: 'All visitors, including guests not logged in' },
  { value: 1, label: 'Logged-in users',    desc: 'Any authenticated user (Individual, Org, or Admin)' },
  { value: 2, label: 'Guests only',        desc: 'Only visitors who are NOT logged in (e.g. Login, Register links)' },
  { value: 3, label: 'Admins only',        desc: 'Only users with Admin role' },
  { value: 4, label: 'Organizations only', desc: 'Only users with Organisation role' },
  { value: 5, label: 'Individuals only',   desc: 'Only users with Individual role' },
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
          <p class="page-sub">Build the website navigation. Create top-level links and nest items under them to make dropdowns. Control who sees each link using the "Visible To" setting.</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">+ Add Menu Item</button>
      </div>

      @if (loading()) {
        <div class="empty-state"><div class="spinner"></div><p>Loading…</p></div>
      } @else {
        <div class="menu-tree">
          @for (item of topLevel(); track item.id) {
            <!-- Top-level row -->
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
                <span class="badge badge-blue">{{ visibleToLabel(item.visibleTo) }}</span>
                @if (!item.isVisible) { <span class="badge badge-gray">Hidden</span> }
                <span class="order-badge">#{{ item.displayOrder }}</span>
              </div>
              <div class="menu-row-actions">
                <button class="btn-sm btn-success-soft" (click)="openCreate(item.id)" title="Add sub-item under this">+ Sub-item</button>
                <button class="btn-sm btn-edit" (click)="openEdit(item)">Edit</button>
                <button class="btn-sm btn-danger" (click)="deleteTarget.set(item)">Delete</button>
              </div>
            </div>

            <!-- Children -->
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
                  <span class="badge badge-blue">{{ visibleToLabel(child.visibleTo) }}</span>
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

          @if (allItems().length === 0) {
            <div class="empty-state">
              <i class="bi bi-list-nested empty-icon"></i>
              <h3>No menu items yet</h3>
              <p>Create your first navigation link above.</p>
            </div>
          }
        </div>
      }

      <div class="legend">
        <strong>Visible To legend:</strong>
        @for (opt of visibleToOptions; track opt.value) {
          <span class="legend-item"><span class="badge badge-blue">{{ opt.label }}</span> {{ opt.desc }}</span>
        }
      </div>
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
                <span class="field-hint">The text shown in the navigation bar.</span>
              </div>
              <div class="form-group">
                <label>Icon</label>
                <input [(ngModel)]="form.icon" placeholder="e.g. bi-house-fill, bi-cart, bi-person" />
                <span class="field-hint">Bootstrap Icon class name (without the leading "bi "). Browse at icons.getbootstrap.com. Leave blank for no icon.</span>
              </div>
            </div>
            <div class="form-group">
              <label>Link URL</label>
              <input [(ngModel)]="form.url" placeholder="e.g. /products, /dashboard, https://..." />
              <span class="field-hint">Where this link navigates. Leave blank for a section header with no link.</span>
            </div>
          </div>

          <div class="form-section">
            <div class="form-group">
              <label>Parent (for sub-menus)</label>
              <select [(ngModel)]="form.parentId">
                <option [ngValue]="undefined">— Top-level item —</option>
                @for (item of topLevel(); track item.id) {
                  <option [ngValue]="item.id">{{ item.icon ?? '' }} {{ item.label }}</option>
                }
              </select>
              <span class="field-hint">Choose a parent to nest this item as a dropdown inside another link.</span>
            </div>

            <div class="form-group">
              <label>Visible To — Who can see this link?</label>
              <select [(ngModel)]="form.visibleTo">
                @for (opt of visibleToOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }} — {{ opt.desc }}</option>
                }
              </select>
              <span class="field-hint">Controls which users see this menu item based on their login status and role.</span>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Display Order</label>
                <input type="number" [(ngModel)]="form.displayOrder" min="0" />
                <span class="field-hint">Lower number = shown first. Use 1, 2, 3…</span>
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
                <span>Use "new tab" for external links.</span>
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
            @if (!deleteTarget()!.parentId) {
              This will also delete all sub-items nested under it.
            } @else {
              This sub-item will be removed from the navigation.
            }
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

    .legend {
      display: flex; flex-wrap: wrap; gap: .625rem; align-items: center;
      background: #f8fafc; border-radius: 8px; padding: .875rem 1rem;
      font-size: .78rem; color: #64748b;
      strong { color: #374151; margin-right: .5rem; }
    }
    .legend-item { display: flex; align-items: center; gap: .375rem; }
  `]
})
export class AdminMenusComponent implements OnInit {
  private cms = inject(CmsService);

  allItems = signal<MenuItem[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editing = signal(false);
  saving = signal(false);
  error = signal('');
  deleteTarget = signal<MenuItem | null>(null);

  visibleToOptions = VISIBLE_TO_OPTIONS;

  form: { id?: number; parentId?: number; label: string; url: string; icon: string; displayOrder: number; isVisible: boolean; visibleTo: number; openInNewTab: boolean } = this.emptyForm();

  topLevel = () => this.allItems().filter(i => !i.parentId);
  childrenOf = (pid: number) => this.allItems().filter(i => i.parentId === pid);
  visibleToLabel = (v: number) => VISIBLE_TO_OPTIONS.find(o => o.value === v)?.label ?? String(v);
  parentLabel = () => this.allItems().find(i => i.id === this.form.parentId)?.label ?? '';

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.cms.getAllMenuItems().subscribe({ next: items => { this.allItems.set(items); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  openCreate(parentId?: number) {
    this.form = this.emptyForm();
    if (parentId) this.form.parentId = parentId;
    this.editing.set(false);
    this.error.set('');
    this.showForm.set(true);
  }

  openEdit(item: MenuItem) {
    this.form = { id: item.id, parentId: item.parentId, label: item.label, url: item.url ?? '', icon: item.icon ?? '', displayOrder: item.displayOrder, isVisible: item.isVisible, visibleTo: item.visibleTo, openInNewTab: item.openInNewTab };
    this.editing.set(true);
    this.error.set('');
    this.showForm.set(true);
  }

  save() {
    if (!this.form.label.trim()) { this.error.set('Label is required.'); return; }
    this.saving.set(true);
    const dto = { parentId: this.form.parentId || undefined, label: this.form.label, url: this.form.url || undefined, icon: this.form.icon || undefined, displayOrder: this.form.displayOrder, isVisible: this.form.isVisible, visibleTo: +this.form.visibleTo, openInNewTab: this.form.openInNewTab };
    const obs: Observable<unknown> = this.editing()
      ? this.cms.updateMenuItem({ ...dto, id: this.form.id! })
      : this.cms.createMenuItem(dto);
    obs.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.load(); },
      error: (e: any) => { this.saving.set(false); this.error.set(e.error?.message ?? 'Failed to save.'); }
    });
  }

  confirmDelete() {
    if (!this.deleteTarget()) return;
    this.cms.deleteMenuItem(this.deleteTarget()!.id).subscribe({ next: () => { this.deleteTarget.set(null); this.load(); } });
  }

  closeForm() { this.showForm.set(false); }

  private emptyForm() {
    return { label: '', url: '', icon: '', displayOrder: 0, isVisible: true, visibleTo: 0, openInNewTab: false };
  }
}
