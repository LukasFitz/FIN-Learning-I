import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {Course} from '../models/Course';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
/**
 * Service that handles saving and getting Courses from Firebase
 */
export class CoursesService {

  constructor(private db: AngularFirestore) {
  }

  /**
   * adds given module to database
   * @param course Course object of the course to be added
   */
  public addModule(course: Course): Promise<void> {
    return this.db.collection('courses').doc(course.name).set(course);
  }

  /**
   * deletes the given module in the database
   * @param courseName Course object of the course to be deleted
   */
  public deleteModule(courseName: string): Promise<void> {
    return this.db.collection('courses').doc(courseName).delete();
  }

  /**
   * Observable containing an array of all courses
   * fires on change
   */
  public getCourses(): Observable<Course[]> {
    return this.db.collection('courses').snapshotChanges().pipe(
      map(coursesDocsArray => {
        const courseArray: Course[] = [];
        coursesDocsArray.forEach(doc => courseArray.push(doc.payload.doc.data() as Course));
        return courseArray;
      }));
  }

}
