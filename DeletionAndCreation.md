I have an Angular + backend product management system with image upload, and I need help fixing data consistency issues in the design.

Current Flow

1. Image upload happens immediately when selected
   onImagePicked(event: Event) {
   const file = (event.target as HTMLInputElement).files?.[0];
   if (!file) return;

this.upload.upload(file).subscribe({
next: url => {
this.form.imageUrl = url;
}
});
} 2. Product is created later using a separate API call
this.svc.createProduct(this.form).subscribe(...) 3. Deleting a product currently does NOT delete the image file from storage
Problems
Issue 1: Orphan uploads on failed create
Images are uploaded immediately on selection
If product creation fails, the uploaded image remains on server
This leads to unused/orphan images and storage waste
Issue 2: Orphan images on delete
When a product is deleted, the image file is NOT removed
This again leaves unused files in storage
Over time, storage grows unnecessarily
What I want you to do

Please analyze this system and propose a production-grade solution.

I need:

1. Problem analysis
   Why this design is problematic in real-world systems
2. Better architecture options

Suggest multiple approaches such as:

FormData single-request upload (image + product together)
Temporary upload + confirmation flow
Reference counting / usage tracking
Background cleanup jobs (cron / worker)
Soft delete strategies for files 3. Best recommended solution
Choose the most scalable and practical approach for a SaaS system
Explain why it is better than the others 4. Deletion handling fix

Specifically explain:

How to ensure image is deleted when product is deleted
How to avoid deleting images that are still referenced elsewhere 5. Implementation guidance

Provide example changes for:

Angular frontend
Backend (generic REST or ASP.NET Core style is fine)
Constraints:
Must be production-ready thinking
Must handle edge cases (failed uploads, retries, partial failures)
Avoid unnecessary overengineering but ensure consistency and cleanup
