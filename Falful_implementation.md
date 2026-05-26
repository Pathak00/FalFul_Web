You are helping me build a production-ready platform called FalFul from scratch.

FalFul is a modern fruit eCommerce and delivery platform built for scalability, maintainability, and future expansion.

The project should be developed using:

Angular (Frontend/UI)
ASP.NET Core Web API (Backend)
SQL Server
Dapper + Stored Procedures
Clean Architecture

The system must support:

Individual users
Organizations
Admin management
Product management
Dynamic website content management
Online ordering
Delivery tracking
Payment tracking

The entire project MUST be developed PHASE BY PHASE.

DO NOT attempt to build everything at once.

Project Overview
Project Name

FalFul

Platform Goal

FalFul is a modern online fruit eCommerce platform where customers can:

Order fruits online
Buy fruits by KG
Order cut/prepared fruits
Customize fruit orders
Track deliveries
Manage their order history

The system should support:

Retail customers
Organizations/businesses
Full admin management
Dynamic content/pages
Promotions and discounts

The platform should feel:

Premium
Modern
Highly visual
Smooth and animated
Mobile-ready
Scalable for future growth
Technology Stack
Frontend
Angular (latest stable version)
Angular Standalone Components preferred
Angular Signals where appropriate
Responsive UI
Modern animations
Angular Material or modern UI system
Backend
ASP.NET Core Web API
Database
SQL Server
Data Access
Dapper
Stored Procedures
Architecture Requirements

The project MUST follow proper Clean Architecture principles.

The architecture should support future:

Mobile apps
Delivery apps
Multi-role systems
Subscription systems
Analytics
Multi-vendor support
Recommended Solution Structure
FalFul.sln

/src

/Frontend
/falful-web

/Backend

      /FalFul.API
      /FalFul.Domain
      /FalFul.Application
      /FalFul.Infrastructure
      /FalFul.Persistence

/tests
Layer Responsibilities
Domain Layer

Contains:

Entities
Enums
Business rules
Core domain models

Examples:

User
Organization
Product
Category
Order
Payment
Delivery
Page
Banner
Discount
Notification

This layer must NOT depend on external frameworks.

Application Layer

Contains:

DTOs
Interfaces
Business workflows
Validation
Services
CQRS if needed

Examples:

Register user
Place order
Update page content
Manage products
Track delivery
Manage discounts
Infrastructure Layer

Contains:

Dapper repositories
SQL implementations
External integrations
Payment integrations
Email/SMS services
API Layer

Contains:

Controllers
Middleware
Authentication
Swagger
JWT configuration
Angular Frontend

Contains:

Landing page
Authentication pages
Product pages
Customer dashboard
Organization dashboard
Admin dashboard
Dynamic CMS-driven pages
Authentication System
Individual User Registration

Users can register using:

Mobile number + OTP
OR
Google/Gmail login
Organization Registration

Organizations such as:

Gyms
Stores
Cafes
Offices
Businesses

Organizations may later support:

Bulk ordering
Team ordering
Scheduled subscriptions
Admin System

The admin panel should be powerful and scalable.

Admins should be able to:

User Management
Manage users
Manage organizations
Manage roles/permissions
Product Management
Add/Edit/Delete fruits
Manage categories
Upload product images
Manage stock
Change pricing
Create featured products
Order Management
Track orders
Update delivery statuses
Manage refunds
View reports
Payment Management
Track transactions
Monitor payment statuses
View payment reports
Website Content Management (Important)

Admins should also be able to dynamically manage website content without code changes.

The admin panel should support:

Dynamic Page Management

Admins can:

Create pages
Edit pages
Delete pages
Publish/unpublish pages

Examples:

About Us
Contact Us
Privacy Policy
Terms & Conditions
Delivery Information
FAQ
CMS Features

Admin should be able to:

Add banners
Add homepage sections
Manage sliders/carousels
Add promotional content
Update landing page content
Add notices and announcements
Control homepage layout sections
Promotional System

Admins should:

Create discounts
Schedule promotions
Add campaign banners

Examples:

“20% Off Mangoes”
“Free Delivery Weekend”
“Summer Fruit Festival”
Product System

Products include:

Fruits sold by KG
Cut fruits
Prepared fruit bowls
Fruit packs
Custom fruit combinations

Examples:

1kg Apple
Mixed Fruit Box
Watermelon Bowl
Ordering System

Customers should be able to:

Browse products
Add to cart
Customize orders
Select quantity
Add delivery instructions
Schedule delivery
Track order progress
Delivery System

Order statuses may include:

Pending
Confirmed
Preparing
Out for Delivery
Delivered
Cancelled

Customers should also see:

Delivery history
Order reports
Payment history
Payment System

The payment architecture should be scalable and future-ready.

Future integrations:

eSewa
Khalti
Stripe
Cash on Delivery

The architecture should support:

Transaction logs
Refund handling
Payment tracking
Payment history
UI/UX Requirements
Landing Page

The landing page should be:

Premium
Highly modern
Visually impressive
Smooth and animated

Use:

Scroll animations
Floating fruit animations
Glassmorphism where suitable
Modern gradients
Micro interactions
Smooth transitions
Responsive layouts
Landing Page Design Inspiration

Use this for inspiration only:

Steelworks Studio

Do NOT copy directly.

Use it to inspire:

Motion design
Interaction quality
Premium feel
Visual storytelling
Angular Frontend Expectations

Use modern Angular best practices:

Standalone components
Lazy loading
Feature-based architecture
Shared component library
Route guards
API abstraction services
Reusable layouts
CMS-driven dynamic rendering where needed
Backend Expectations
API Standards
RESTful APIs
DTO separation
Validation
JWT authentication
Refresh token-ready architecture
Global exception handling
Middleware architecture
Database Expectations
SQL Server + Dapper + Stored Procedures

Need:

Optimized stored procedures
Proper naming conventions
Audit fields
Soft delete support
Logging support
Transaction handling
Suggested Database Entities
Core Tables
Users
Organizations
Roles
Products
Categories
ProductVariants
Orders
OrderItems
Payments
Deliveries
Discounts
Notifications
Pages
PageSections
Banners
Sliders
Cart
Addresses
Reviews
Architecture Rules
Keep code modular
Avoid tight coupling
Use dependency injection
Keep business logic out of controllers
Use async/await everywhere possible
Prepare APIs for mobile apps
Use reusable frontend components
Follow separation of concerns
Build scalable CMS functionality
Follow production-grade standards
Development Methodology

The project MUST be developed phase-by-phase.

Each phase should:

Be independently testable
Have clean architecture
Be production-oriented
Maintain scalability

DO NOT skip foundational architecture.

Development Phases
Phase 1 — Foundation & Architecture
Backend
Clean architecture setup
Database setup
Dapper configuration
JWT authentication
User registration
Organization registration
Frontend
Angular setup
Routing setup
Shared layouts
Authentication UI
Base landing page structure
Phase 2 — Landing Page & Design System
Goals
Premium landing page
Animation system
Responsive design system
Hero sections
Product showcase sections
Promotional sections
Phase 3 — CMS & Dynamic Website Management
Backend
Dynamic page APIs
Banner APIs
Homepage section APIs
CMS management APIs
Frontend
Dynamic page rendering
CMS-driven sections
Admin content management UI
Phase 4 — Product Management System
Features
Product APIs
Categories
Product customization
Admin product management
Product listing pages
Phase 5 — Cart & Ordering System
Features
Cart management
Checkout flow
Delivery scheduling
Order placement
Order tracking
Phase 6 — Payment Integration
Features
Payment abstraction
Payment gateway integrations
Transaction tracking
Payment status management
Phase 7 — Admin Dashboard
Features
Analytics
Inventory management
Delivery monitoring
Reports
Discount management
Notice management
Website content management
Phase 8 — Optimization & Scaling
Features
Performance optimization
Security hardening
Caching
Logging improvements
Mobile API readiness
Refactoring
Future Expansion Possibilities

The architecture should remain extensible for:

Mobile applications
Delivery rider apps
Subscription delivery
Loyalty systems
AI recommendations
Inventory forecasting
Multi-vendor marketplace
How You Should Help

Act as:

Senior Software Architect
Angular Expert
ASP.NET Core Expert
UI/UX Consultant
Scalable System Designer
Coding Expectations

When generating code:

Generate production-ready code
Follow clean architecture
Use scalable Angular architecture
Keep backend modular
Use reusable components
Explain architectural decisions
Prefer maintainability over shortcuts
Important Development Rule

Always work:

Phase by phase
Feature by feature
Cleanly and modularly
With future scalability in mind

Never generate rushed or tightly coupled implementations.

should use dapper but he query willbe handlein sql as a store procedures update
FalFul Project Context for Claude Code

You are helping me build a production-ready platform called FalFul from scratch.

FalFul is a modern fruit eCommerce and delivery platform built for scalability, maintainability, clean architecture, and future expansion.

The project should be developed using:

Angular (Frontend/UI)
ASP.NET Core Web API (Backend)
SQL Server
Dapper
Stored Procedures for ALL database queries and operations

The system must support:

Individual users
Organizations
Admin management
Product management
CMS/page management
Online ordering
Delivery tracking
Payment tracking

The entire project MUST be developed PHASE BY PHASE.

DO NOT attempt to build everything at once.

Core Technical Rule (Very Important)
Database Access Rule

The backend MUST use:

Dapper as ORM/data access tool
SQL Server Stored Procedures for ALL database operations

Important:

Queries should NOT be written directly inside repositories/services
SQL logic should be fully handled inside SQL Server Stored Procedures
Dapper should only execute stored procedures and map results
Stored Procedure Standards

All database operations should use:

Properly named stored procedures
Transaction-safe procedures
Optimized SQL queries
Auditing support
Soft delete support
Error handling

Examples:

sp_User_Register
sp_Product_Create
sp_Order_Create
sp_Payment_Insert
sp_Page_Update
Project Overview
Project Name

FalFul

Platform Goal

FalFul is an online fruit eCommerce platform where customers can:

Order fruits online
Buy fruits by KG
Order cut/prepared fruits
Customize fruit orders
Track deliveries
Manage order history

The platform should support:

Retail customers
Organizations/businesses
Full admin management
Dynamic website content/pages
Promotions and discounts

The platform should feel:

Premium
Modern
Smooth
Animated
Mobile-ready
Scalable
Technology Stack
Frontend
Angular (latest stable version)
Angular Standalone Components preferred
Angular Signals where appropriate
Responsive UI
Modern animations
Angular Material or modern UI system
Backend
ASP.NET Core Web API
Database
SQL Server
Data Access
Dapper
Stored Procedures ONLY
Architecture Requirements

The project MUST follow proper Clean Architecture principles.

The architecture should support future:

Mobile apps
Delivery apps
Multi-role systems
Subscription systems
Analytics
Multi-vendor support
Recommended Solution Structure
FalFul.sln

/src

/Frontend
/falful-web

/Backend

      /FalFul.API
      /FalFul.Domain
      /FalFul.Application
      /FalFul.Infrastructure
      /FalFul.Persistence

/tests
Layer Responsibilities
Domain Layer

Contains:

Entities
Enums
Business rules
Core domain models

Examples:

User
Organization
Product
Category
Order
Payment
Delivery
Page
Banner
Discount
Notification

This layer must NOT depend on external frameworks.

Application Layer

Contains:

DTOs
Interfaces
Business workflows
Validation
Services
CQRS if needed

Examples:

Register user
Place order
Update page content
Manage products
Track delivery
Manage discounts
Infrastructure Layer

Contains:

Dapper repositories
SQL connection management
Stored procedure execution
External integrations
Payment integrations
Email/SMS services
API Layer

Contains:

Controllers
Middleware
Authentication
Swagger
JWT configuration
Angular Frontend

Contains:

Landing page
Authentication pages
Product pages
Customer dashboard
Organization dashboard
Admin dashboard
CMS-driven dynamic pages
Authentication System
Individual User Registration

Users can register using:

Mobile number + OTP
OR
Google/Gmail login
Organization Registration

Organizations such as:

Gyms
Stores
Cafes
Offices
Businesses

Organizations may later support:

Bulk ordering
Team ordering
Scheduled subscriptions
Admin System

The admin panel should be powerful and scalable.

Admins should be able to:

User Management
Manage users
Manage organizations
Manage roles/permissions
Product Management
Add/Edit/Delete fruits
Manage categories
Upload product images
Manage stock
Change pricing
Create featured products
Order Management
Track orders
Update delivery statuses
Manage refunds
View reports
Payment Management
Track transactions
Monitor payment statuses
View payment reports
Website CMS & Dynamic Content Management

Admins should also be able to dynamically manage website content without changing code.

Dynamic Page Management

Admins can:

Create pages
Edit pages
Delete pages
Publish/unpublish pages

Examples:

About Us
Contact Us
Privacy Policy
Terms & Conditions
FAQ
Delivery Information
CMS Features

Admins should be able to:

Add banners
Add sliders/carousels
Manage homepage sections
Add promotional content
Add notices/announcements
Update homepage content dynamically
Promotional System

Admins should:

Create discount campaigns
Schedule promotions
Add campaign banners

Examples:

“20% Off Mangoes”
“Free Delivery Weekend”
“Summer Fruit Festival”
Product System

Products include:

Fruits sold by KG
Cut fruits
Prepared fruit bowls
Fruit packs
Custom fruit combinations

Examples:

1kg Apple
Mixed Fruit Box
Watermelon Bowl
Ordering System

Customers should be able to:

Browse products
Add to cart
Customize orders
Select quantity
Add delivery instructions
Schedule delivery
Track order progress
Delivery System

Order statuses may include:

Pending
Confirmed
Preparing
Out for Delivery
Delivered
Cancelled

Customers should also see:

Delivery history
Order reports
Payment history
Payment System

The payment architecture should be scalable and future-ready.

Future integrations:

eSewa
Khalti
Stripe
Cash on Delivery

The architecture should support:

Transaction logs
Refund handling
Payment tracking
Payment history
UI/UX Requirements
Landing Page

The landing page should be:

Premium
Highly modern
Visually impressive
Smooth and animated

Use:

Scroll animations
Floating fruit animations
Glassmorphism where suitable
Modern gradients
Micro interactions
Smooth transitions
Responsive layouts
Landing Page Design Inspiration

Use this for inspiration only:

Steelworks Studio

Do NOT copy directly.

Use it to inspire:

Motion design
Interaction quality
Premium feel
Visual storytelling
Angular Frontend Expectations

Use modern Angular best practices:

Standalone components
Lazy loading
Feature-based architecture
Shared component library
Route guards
API abstraction services
Reusable layouts
CMS-driven dynamic rendering where needed
Backend Expectations
API Standards
RESTful APIs
DTO separation
Validation
JWT authentication
Refresh token-ready architecture
Global exception handling
Middleware architecture
Database Expectations
SQL Server + Dapper + Stored Procedures

Requirements:

ALL queries must be handled in Stored Procedures
Dapper only executes stored procedures
No inline SQL queries in C#
Use parameterized SP execution
Use transaction-safe procedures
Optimize queries properly

Need:

Proper naming conventions
Audit fields
Soft delete support
Logging support
Transaction handling
Suggested Database Entities
Core Tables
Users
Organizations
Roles
Products
Categories
ProductVariants
Orders
OrderItems
Payments
Deliveries
Discounts
Notifications
Pages
PageSections
Banners
Sliders
Cart
Addresses
Reviews
Architecture Rules
Keep code modular
Avoid tight coupling
Use dependency injection
Keep business logic out of controllers
Use async/await everywhere possible
Prepare APIs for mobile apps
Use reusable frontend components
Follow separation of concerns
Build scalable CMS functionality
Follow production-grade standards
Keep SQL logic inside stored procedures only
Development Methodology

The project MUST be developed phase-by-phase.

Each phase should:

Be independently testable
Have clean architecture
Be production-oriented
Maintain scalability

DO NOT skip foundational architecture.

Development Phases
Phase 1 — Foundation & Architecture
Backend
Clean architecture setup
Database setup
Dapper configuration
Stored procedure architecture
JWT authentication
User registration
Organization registration
Frontend
Angular setup
Routing setup
Shared layouts
Authentication UI
Base landing page structure
Phase 2 — Landing Page & Design System
Goals
Premium landing page
Animation system
Responsive design system
Hero sections
Product showcase sections
Promotional sections
Phase 3 — CMS & Dynamic Website Management
Backend
Dynamic page APIs
Banner APIs
Homepage section APIs
CMS management APIs
Stored procedures for CMS management
Frontend
Dynamic page rendering
CMS-driven sections
Admin content management UI
Phase 4 — Product Management System
Features
Product APIs
Categories
Product customization
Admin product management
Product listing pages
Phase 5 — Cart & Ordering System
Features
Cart management
Checkout flow
Delivery scheduling
Order placement
Order tracking
Phase 6 — Payment Integration
Features
Payment abstraction
Payment gateway integrations
Transaction tracking
Payment status management
Phase 7 — Admin Dashboard
Features
Analytics
Inventory management
Delivery monitoring
Reports
Discount management
Notice management
Website content management
Phase 8 — Optimization & Scaling
Features
Performance optimization
Security hardening
Caching
Logging improvements
Mobile API readiness
Refactoring
Future Expansion Possibilities

The architecture should remain extensible for:

Mobile applications
Delivery rider apps
Subscription delivery
Loyalty systems
AI recommendations
Inventory forecasting
Multi-vendor marketplace
How You Should Help

Act as:

Senior Software Architect
Angular Expert
ASP.NET Core Expert
SQL Server Expert
Dapper Expert
UI/UX Consultant
Scalable System Designer
Coding Expectations

When generating code:

Generate production-ready code
Follow clean architecture
Use scalable Angular architecture
Keep backend modular
Use reusable components
Use Dapper with Stored Procedures ONLY
Explain architectural decisions
Prefer maintainability over shortcuts
Important Development Rule

Always work:

Phase by phase
Feature by feature
Cleanly and modularly
With future scalability in mind

Never generate rushed or tightly coupled implementations.
