import { MatPaginatorIntl } from '@angular/material/paginator';

export class CustomPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Items per page:';
  override nextPageLabel = 'Next page';
  override previousPageLabel = 'Previous page';

  // Override other properties and methods as needed

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);

    return `Showing ${start} to ${end} of ${length} entries`;
  }
}