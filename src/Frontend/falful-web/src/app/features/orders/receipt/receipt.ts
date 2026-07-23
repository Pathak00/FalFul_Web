import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReceiptService } from '../../../core/services/receipt.service';

@Component({
  selector: 'app-receipt-print',
  standalone: true,
  imports: [],
  templateUrl: './receipt.html'
})
export class ReceiptPrintComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private receiptSvc = inject(ReceiptService);

  ngOnInit() {
    const orderId = Number(this.route.snapshot.paramMap.get('id'));
    this.receiptSvc.getReceipt(orderId).subscribe({
      next: r => {
        const html = r.html.replace(
          '</body>',
          `<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},400);});</script></body>`
        );
        document.open();
        document.write(html);
        document.close();
      },
      error: () => {
        document.open();
        document.write(`<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:3rem;color:#ef4444"><h3>Receipt unavailable</h3><p>Could not load the receipt for this order.</p><button onclick="window.close()" style="margin-top:1rem;padding:.5rem 1.25rem;border-radius:6px;background:#f1f5f9;border:1px solid #e2e8f0;cursor:pointer">Close Tab</button></body></html>`);
        document.close();
      }
    });
  }
}
