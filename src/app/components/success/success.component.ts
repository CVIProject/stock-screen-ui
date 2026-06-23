import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-success-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="success-page-wrapper">
      <div class="success-card">
        <div class="success-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h2>Success!</h2>
        <p>Your filtered Excel file has been downloaded successfully.</p>
        <button class="btn btn-success btn-lg" type="button" (click)="goBack()">
          <i class="fas fa-undo-alt me-2"></i>
          Filter another file
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .success-page-wrapper {
        width: 100%;
        min-height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
      }

      .success-card {
        text-align: center;
        background: white;
        border-radius: 22px;
        padding: 48px 36px;
        max-width: 540px;
        width: 100%;
        box-shadow: 0 18px 60px rgba(0, 0, 0, 0.12);
      }

      .success-icon {
        width: 96px;
        height: 96px;
        margin: 0 auto 28px auto;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        font-size: 42px;
      }

      .success-card h2 {
        margin: 0 0 16px;
        font-size: 30px;
        font-weight: 700;
      }

      .success-card p {
        margin: 0 0 30px;
        color: #5a5f6e;
        font-size: 16px;
        line-height: 1.6;
      }

      .btn-success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: none;
        color: white;
        padding: 14px 26px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 700;
      }

      .btn-success:hover {
        background: linear-gradient(135deg, #0f766e 0%, #047857 100%);
      }
    `
  ]
})
export class SuccessPageComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/']);
  }
}
