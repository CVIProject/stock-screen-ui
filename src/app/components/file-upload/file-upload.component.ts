import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockApiService } from '../../services/stock-api.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {

  selectedFile!: File;

  loading = false;

  successMessage = '';

  constructor(
    private stockApiService: StockApiService
  ) {}

  onFileSelected(event: any) {

    this.selectedFile = event.target.files[0];
  }

  filterFile() {

    if (!this.selectedFile) {

      alert('Please select a file');
      return;
    }

    this.loading = true;

    this.stockApiService
      .uploadExcel(this.selectedFile)
      .subscribe({

        next: (response: Blob) => {

          const blob = new Blob(
            [response],
            {
              type:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
          );

          const url = window.URL.createObjectURL(blob);

          const link = document.createElement('a');

          link.href = url;

          link.download = 'filtered_output.xlsx';

          link.click();

          window.URL.revokeObjectURL(url);

          this.loading = false;

          this.successMessage =
            'File processed successfully.';
        },

        error: () => {

          this.loading = false;

          alert(
            'Error processing file'
          );
        }
      });
  }
}