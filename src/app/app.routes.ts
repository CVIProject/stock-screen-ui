import { Routes } from '@angular/router';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { SuccessPageComponent } from './components/success/success.component';

export const routes: Routes = [
  { path: '', component: FileUploadComponent },
  { path: 'success', component: SuccessPageComponent },
  { path: '**', redirectTo: '' }
];
