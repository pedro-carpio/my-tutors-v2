# My Tutors v2 - Firestore Services Documentation

This collection of services provides a comprehensive interface for managing a tutoring platform with Angular and Firebase Firestore.

## Services Overview

### Core Entity Services

1. **UserService** - Manages user accounts and authentication data
2. **TutorService** - Handles tutor profiles and information
3. **StudentService** - Manages student profiles and learning goals
4. **InstitutionService** - Handles educational institution data

### Language and Course Management

5. **LanguageService** - Manages supported languages (ISO 639-1 codes)
6. **CourseService** - Handles course creation and management
7. **ClassService** - Manages individual class sessions
8. **AvailabilityService** - Handles tutor availability scheduling

### Business Logic Services

9. **PaymentService** - Manages payment transactions and tracking
10. **FeedbackService** - Handles class feedback and ratings
11. **ChatService** - Real-time messaging (existing)
12. **SessionService** - Authentication and session management (existing)

## Usage Examples

### Creating a New User and Tutor Profile

```typescript
import { UserService, TutorService } from './services';

// Inject services
constructor(
  private userService: UserService,
  private tutorService: TutorService
) {}

// Create user account
async createTutorAccount(userData: any) {
  // 1. Create user account
  const userId = await this.userService.createUser({
    email: userData.email,
    role: 'tutor'
  });

  // 2. Create tutor profile
  await this.tutorService.createTutor({
    user_id: userId,
    full_name: userData.fullName,
    birth_date: userData.birthDate,
    nationality: userData.nationality,
    max_hours_per_week: userData.maxHours
  });
}
```

### Scheduling a Class

```typescript
import { ClassService, AvailabilityService } from './services';

async scheduleClass(classData: any) {
  // 1. Check tutor availability
  const conflicts = await this.availabilityService.hasTimeConflict(
    classData.tutorId,
    classData.date,
    classData.startTime,
    classData.endTime
  );

  if (!conflicts) {
    // 2. Create the class
    const classId = await this.classService.scheduleClass(classData, classData.scheduledDate);
    
    // 3. Remove availability slot (or mark as booked)
    await this.availabilityService.deleteAvailability(classData.availabilityId);
    
    return classId;
  } else {
    throw new Error('Time slot not available');
  }
}
```

### Processing Payment

```typescript
import { PaymentService, ClassService } from './services';

async processClassPayment(classId: string, paymentData: any) {
  // 1. Create payment record
  const paymentId = await this.paymentService.createPayment({
    payer_id: paymentData.studentId,
    payee_id: paymentData.tutorId,
    amount: paymentData.amount,
    currency: 'USD',
    status: 'pending'
  });

  try {
    // 2. Process payment with payment gateway
    const paymentResult = await this.processWithPaymentGateway(paymentData);
    
    if (paymentResult.success) {
      // 3. Mark payment as completed
      await this.paymentService.processPayment(paymentId);
    } else {
      // 4. Mark payment as failed
      await this.paymentService.failPayment(paymentId);
    }
    
    return paymentResult;
  } catch (error) {
    await this.paymentService.failPayment(paymentId);
    throw error;
  }
}
```

### Creating Course with Enrollment

```typescript
import { CourseService, ClassService, UserService } from './services';

async createCourseWithClasses(courseData: any, classDates: Date[]) {
  // 1. Create the course
  const courseId = await this.courseService.createCourse(courseData);

  // 2. Create individual class sessions
  const classPromises = classDates.map(date => 
    this.classService.scheduleClass({
      course_id: courseId,
      tutor_id: courseData.tutorId,
      student_id: '', // Will be filled when students enroll
      duration_minutes: courseData.duration,
      price_per_hour: courseData.pricePerHour
    }, date)
  );

  await Promise.all(classPromises);
  return courseId;
}
```

### Getting Dashboard Data

```typescript
import { 
  TutorService, 
  ClassService, 
  PaymentService, 
  FeedbackService 
} from './services';

async getTutorDashboard(tutorId: string) {
  const [
    tutorProfile,
    upcomingClasses,
    recentPayments,
    recentFeedback
  ] = await Promise.all([
    this.tutorService.getTutor(tutorId),
    this.classService.getUpcomingClassesByTutor(tutorId, 5),
    this.paymentService.getCompletedPaymentsByPayee(tutorId),
    this.feedbackService.getFeedbackByMinRating(4) // Get good feedback
  ]);

  return {
    profile: tutorProfile,
    upcomingClasses,
    recentPayments,
    feedback: recentFeedback
  };
}
```

## Data Types

All services use TypeScript interfaces defined in `types/firestore.types.ts`:

- `User`, `Tutor`, `Student`, `Institution`
- `Language`, `Course`, `Class`, `Availability`
- `Payment`, `Feedback`
- `UserRole`, `PaymentStatus`, `LevelCEFR`

## Firebase Rules Considerations

Make sure your Firestore security rules align with these service patterns:

```javascript
// Example rule for tutors collection
match /tutors/{tutorId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == tutorId;
}

// Example rule for classes
match /classes/{classId} {
  allow read, write: if request.auth != null && 
    (request.auth.uid == resource.data.tutor_id || 
     request.auth.uid == resource.data.student_id);
}
```

## Performance Optimization

1. **Indexing**: Create composite indexes for common query patterns
2. **Pagination**: Use the `limit()` parameter in services for large datasets
3. **Caching**: Consider implementing local caching for frequently accessed data
4. **Batch Operations**: Use batch writes for related document updates

## Error Handling

All services include try-catch blocks and log errors to the console. In production:

1. Implement proper error logging service
2. Add user-friendly error messages
3. Consider retry mechanisms for network errors
4. Implement offline support where needed

## Next Steps

1. Add authentication guards to protect routes
2. Implement real-time subscriptions where needed
3. Add data validation before Firestore operations
4. Create unit tests for each service
5. Add caching layer for better performance
