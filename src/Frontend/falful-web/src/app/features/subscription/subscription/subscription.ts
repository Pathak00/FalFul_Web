import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SubscriptionProduct } from '../../../core/models/subscription.models';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../../core/models/order.models';
import { AuthService } from '../../../core/services/auth.service';
import { Toast } from '../../../core/services/toast.service';
import { PopUpDialogComponent } from '../../../shared/components/popUp/pop-up-dialog/pop-up-dialog';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { single } from 'rxjs';
import { DialogAction } from '../../../core/models/subscription.models';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.html',
  styleUrls: ['./subscription.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe, RouterLink, PopUpDialogComponent],
})
export class Subscription implements OnInit {
  subscriptionProduct = signal<SubscriptionProduct[]>([]);
  finalTotal = 0;
  loading = signal(true);
  private router = inject(Router);
  public cart = inject(CartService);
  private subscriptionsrv = inject(SubscriptionService);
  private SubscriptionConfirm = signal(false);

  dialogAction = signal(DialogAction.None);
  selectedProduct!: SubscriptionProduct;
  private changePlan = signal(false);

  showDialog = false;

  dialogTitle = '';
  dialogMessage = '';
  ShowOk = true;
  private Subscriptioncreated = signal(false);
  public authsrv = inject(AuthService);

  public isAuthenticated = this.authsrv.isAuthenticated;

  constructor(
    private fb: FormBuilder,
    private svc: ProductService,
  ) {}

  ngOnInit(): void {
    this.loading.set(true);

    this.svc.getSubscriptionProducts().subscribe({
      next: (list) => {
        this.subscriptionProduct.set(list);
      },
    });

    this.loading.set(false);

    // this.calculateTotal();
  }

  onTierChange(): void {
    // this.calculateTotal();
  }

  // onSelectPlan(subItem: SubscriptionProduct): void {
  //   if (this.authsrv.isAuthenticated()) {
  //   } else {
  //     alert('log in');
  //   }
  // }
  onSelectPlan(product: SubscriptionProduct): void {
    this.selectedProduct = product;
    if (!this.authsrv.isAuthenticated()) {
      this.dialogTitle = 'Login Required';
      this.dialogMessage = 'Please login before selecting a subscription plan.';
      this.dialogAction.set(DialogAction.LoginRequired);
      this.showDialog = true;
      return;
    }

    // this.subscriptionsrv.getuserSuscription().subscribe({
    //   next: (subscription) => {
    //     if (subscription) {
    //       console.log(subscription);
    //       if (subscription.data === null) {
    //         this.dialogTitle = 'Confirm';
    //         this.dialogMessage = 'Subscribe to this plan?';
    //         this.dialogAction.set(DialogAction.CreateSubscription);
    //       } else {
    //         this.dialogTitle = 'Change Subscription';
    //         // this.dialogMessage = `You already have ${subscription.data.plan_name}.
    //         this.dialogMessage = `You already have <strong>${subscription.data.plan_name}</strong>.
    //         Do you want to switch to ${product.name}?`;
    //         this.dialogAction.set(DialogAction.ChangePlan);
    //       }
    //     }
    //     this.showDialog = true;
    //   },
    // });

    this.subscriptionsrv.getuserSuscription().subscribe({
      next: (subscription) => {
        if (subscription) {
          console.log(subscription);

          if (subscription.data === null) {
            this.dialogTitle = 'Confirm';
            this.dialogMessage = 'Subscribe to this plan?';
            this.dialogAction.set(DialogAction.CreateSubscription);
          } else {
            this.dialogTitle = 'Change Subscription';

            this.dialogMessage = `You already have <strong>${subscription.data.plan_name}</strong>.
        
Do you want to switch to <strong>${product.name}</strong>?`;

            this.dialogAction.set(DialogAction.ChangePlan);
          }
        }

        this.showDialog = true;
      },
    });
  }

  handleDialogResult(result: boolean): void {
    this.showDialog = false;

    if (!result) {
      this.dialogAction.set(DialogAction.None);
      return;
    }

    switch (this.dialogAction()) {
      case DialogAction.CreateSubscription:
        this.createSubscription();
        break;

      case DialogAction.ChangePlan:
        console.log('dialogacrion');
        this.changeSubscription();
        break;

      case DialogAction.LoginRequired:
        this.router.navigate(['/auth/login']);
        break;

      case DialogAction.Success:
        break;
    }

    this.dialogAction.set(DialogAction.None);
  }

  private createSubscription() {
    this.subscriptionsrv.CreateSubscription(this.selectedProduct).subscribe({
      next: (res) => {
        this.dialogTitle = 'Subscription Created';
        this.dialogMessage = 'Your subscription has been activated.';
        this.showDialog = true;
      },

      error: (err) => {
        // If server says already subscribed
        if (err.error?.code === 'SUBSCRIPTION_EXISTS') {
          this.dialogTitle = 'Change Subscription';
          this.dialogMessage = 'You already have an active subscription. Change to this plan?';
          this.dialogAction.set(DialogAction.ChangePlan);
          this.showDialog = true;

          return;
        }

        this.dialogTitle = 'Error';
        this.dialogMessage = err.error?.error;

        this.showDialog = true;
      },
    });
  }
  private changeSubscription() {
    console.log('CHANGE PAN HIT');
    this.subscriptionsrv.ChangePlan(this.selectedProduct).subscribe({
      next: (res) => {
        this.dialogTitle = 'Plan Changed';
        this.dialogMessage = 'Your subscription has been updated.';
        this.showDialog = true;
      },

      error: (err) => {
        this.dialogTitle = 'Failed';
        this.dialogMessage = err.error?.error;
        this.showDialog = true;
      },
    });
  }
}
