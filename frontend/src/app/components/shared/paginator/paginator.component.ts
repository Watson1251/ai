import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Helper } from '../helpers';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'ngx-paginator',
  templateUrl: './paginator.component.html',
  styleUrls: ['./paginator.component.scss'],
})
export class PaginatorComponent {

  @Input() dataSource: MatTableDataSource<any>;
  
  Helper = Helper;

  length = 5;
  pageSize = 5;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];

  hidePageSize = false;
  showPageSizeOptions = true;
  showFirstLastButtons = true;
  disabled = false;

  @ViewChild(MatPaginator, { static: true }) paginator!: MatPaginator;
  @ViewChild(MatPaginator, { static: false }) set setPaginator(content: any) {
    if (content) {
      setTimeout(() => {
        this.paginator = content as MatPaginator;

        this.paginator._intl.itemsPerPageLabel = 'العناصر:';
        this.paginator._intl.firstPageLabel = 'الصفحة الأولى';
        this.paginator._intl.previousPageLabel = 'الصفحة السابقة';
        this.paginator._intl.nextPageLabel = 'الصفحة التالية';
        this.paginator._intl.lastPageLabel = 'الصفحة الأخيرة';
        this.paginator._intl.getRangeLabel = (page: number, pageSize: number, length: number) => {
          const start = page * pageSize + 1;
          const end = (page + 1) * pageSize;
          return `${start.toString()} - ${end.toString()} من ${length.toString()}`;
        };
        
        this.dataSource.paginator = this.paginator;
      });
    }
  }

  pageEvent?: PageEvent;

  handlePageEvent(e: PageEvent) {
    this.pageEvent = e;
    this.length = e.length;
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.dataSource && changes.dataSource.currentValue) {
      this.dataSource.paginator = this.paginator;
    }
  }
}
