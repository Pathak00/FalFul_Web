import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

/** Formats a UTC date/timestamp in Nepal Standard Time (Asia/Kathmandu, UTC+05:45). */
@Pipe({ name: 'nepalDate', standalone: true })
export class NepalDatePipe implements PipeTransform {
  private dp = new DatePipe('en-US');

  transform(value: Date | string | number | null | undefined, format = 'dd MMM yyyy, h:mm a'): string | null {
    if (value == null) return null;
    return this.dp.transform(value, format, 'Asia/Kathmandu');
  }
}
