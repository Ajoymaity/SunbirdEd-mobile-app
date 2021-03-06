import { BatchConstants } from '../../app.constant';


import { Component, Input, NgZone, OnInit, Inject } from '@angular/core';
import { Events, NavController, PopoverController } from '@ionic/angular';
import { ContentType, MimeType, ContentCard, RouterLinks } from '../../app.constant';
import { CommonUtilService, TelemetryGeneratorService, AppGlobalService, CourseUtilService } from '../../../services';
import { Router, NavigationExtras } from '@angular/router';

import {
  CourseBatchesRequest,
  CourseEnrollmentType,
  CourseBatchStatus,
  CourseService,
  FetchEnrolledCourseRequest,
  Course, GetContentStateRequest, SharedPreferences
} from 'sunbird-sdk';
import { Environment, PageId, InteractType } from '../../../services/telemetry-constants';
import { EnrollmentDetailsPage } from '@app/app/enrolled-course-details-page/enrollment-details-page/enrollment-details-page';

@Component({
  selector: 'app-view-more-card',
  templateUrl: './view-more-card.component.html',
  styleUrls: ['./view-more-card.component.scss'],
})
export class ViewMoreCardComponent implements OnInit {

  /**
   * Contains content details
   */
  @Input() content: any;

  /**
   * Page name
   */
  @Input() type: string;

  /**
   * To show card as disbled or Greyed-out when device is offline
   */
  @Input() cardDisabled = false;

  @Input() enrolledCourses: any;

  @Input() guestUser: any;

  @Input() userId: any;

  /**
   * Contains default image path.
   *
   * Get used when content / course does not have appIcon or courseLogo
   */
  defaultImg: string;
  showLoader: boolean;



  /**
   * checks wheather batch is expired or not
   */
  batchExp: Boolean = false;
  batches: any;
  loader: any;

  /**
   * Default method of cass SearchListComponent
   * @param {NavController} navCtrl To navigate user from one page to another
   * @param {NavParams} navParams ref of navigation params
   * @param zone
   * @param courseUtilService
   * @param events
   * @param commonUtilService
   * @param courseService
   * @param popoverCtrl
   * @param telemetryGeneratorService
   * @param appGlobalService
   */
  constructor(
    public navCtrl: NavController,
    // public navParams: NavParams,
    private zone: NgZone,
    public courseUtilService: CourseUtilService,
    public events: Events,
    private commonUtilService: CommonUtilService,
    @Inject('COURSE_SERVICE') private courseService: CourseService,
    private popoverCtrl: PopoverController,
    private telemetryGeneratorService: TelemetryGeneratorService,
    private appGlobalService: AppGlobalService,
    @Inject('SHARED_PREFERENCES') private preferences: SharedPreferences,
    private router: Router
  ) {
    this.defaultImg = 'assets/imgs/ic_launcher.png';
  }

  async checkRetiredOpenBatch(content: any, layoutName?: string) {
    this.loader = await this.commonUtilService.getLoader();
    await this.loader.present();
    let anyOpenBatch: boolean = false;
    this.enrolledCourses = this.enrolledCourses || [];
    let retiredBatches: Array<any> = [];
    if (layoutName !== ContentCard.LAYOUT_INPROGRESS) {
      retiredBatches = this.enrolledCourses.filter((element) => {
        if (element.contentId === content.identifier && element.batch.status === 1 && element.cProgress !== 100) {
          anyOpenBatch = true;
          content.batch = element.batch;
        }
        if (element.contentId === content.identifier && element.batch.status === 2 && element.cProgress !== 100) {
          return element;
        }
      });
    }
    if (anyOpenBatch || !retiredBatches.length) {
      // open the batch directly
      this.navigateToDetailsPage(content, layoutName);
    } else if (retiredBatches.length) {
      this.navigateToBatchListPopup(content, layoutName, retiredBatches);
    }
  }

  async navigateToBatchListPopup(content: any, layoutName?: string, retiredBatched?: any) {
    const courseBatchesRequest: CourseBatchesRequest = {
      filters: {
        courseId: layoutName === ContentCard.LAYOUT_INPROGRESS ? content.contentId : content.identifier,
        enrollmentType: CourseEnrollmentType.OPEN,
        status: [CourseBatchStatus.NOT_STARTED, CourseBatchStatus.IN_PROGRESS]
      },
      fields: BatchConstants.REQUIRED_FIELDS
    };
    const reqvalues = new Map();
    reqvalues['enrollReq'] = courseBatchesRequest;

    if (this.commonUtilService.networkInfo.isNetworkAvailable) {
      if (!this.guestUser) {
        await this.loader.present();
        this.courseService.getCourseBatches(courseBatchesRequest).toPromise()
          .then((data: any) => {
            this.zone.run(async () => {
              this.batches = data;
              if (this.batches.length) {
                this.telemetryGeneratorService.generateInteractTelemetry(InteractType.TOUCH,
                  'showing-enrolled-ongoing-batch-popup',
                  Environment.HOME,
                  PageId.CONTENT_DETAIL, undefined,
                  reqvalues);
                await this.loader.dismiss();
                // migration-TODO
                // const popover = await this.popoverCtrl.create({
                //     component: EnrollmentDetailsPage,
                //     componentProps: {
                //     upcommingBatches: this.batches,
                //     retiredBatched: retiredBatched,
                //     courseId: content.identifier
                //    },
                //   }
                //   cssClass: 'enrollement-popover' 
                // );
                // popover.onDidDismiss(enrolled => {
                //   if (enrolled) {
                //     this.getEnrolledCourses();
                //   }
                // });

                // this.router.navigate([RouterLinks.ENROLLED_COURSE_DETAILS], {
                //   state: {
                //     ongoingBatches: ongoingBatches,
                //     upcommingBatches: upcommingBatches
                //   }
                // });
              } else {
                await this.loader.dismiss();
                this.navigateToDetailsPage(content, layoutName);
                this.commonUtilService.showToast('NO_BATCHES_AVAILABLE');
              }
            });
          })
          .catch((error: any) => {
            console.log('error while fetching course batches ==>', error);
          });
      } else {
        this.router.navigate([RouterLinks.COURSE_BATCHES]);
      }
    } else {
      this.commonUtilService.showToast('ERROR_NO_INTERNET_MESSAGE');
    }
  }


  async navigateToDetailsPage(content: any, layoutName) {
    this.zone.run(async () => {
      if (this.loader) {
        await this.loader.dismiss();
      }
      if (layoutName === 'enrolledCourse' || content.contentType === ContentType.COURSE) {
        this.router.navigate([RouterLinks.ENROLLED_COURSE_DETAILS], {
          state: {
            content: content
          }
        });
      } else if (content.mimeType === MimeType.COLLECTION) {
        this.router.navigate([RouterLinks.COLLECTION_DETAIL_ETB], {
          state: {
            content: content
          }
        });

      } else {
        this.router.navigate([RouterLinks.CONTENT_DETAILS], {
          state: {
            content: content
          }
        });
      }
    });
  }
  resumeCourse(content: any) {
    const identifier = content.contentId || content.identifier;
    this.getContentState(content);

    const userId = content.userId;
    const lastReadContentIdKey = 'lastReadContentId_' + userId + '_' + identifier + '_' + content.batchId;
    this.preferences.getString(lastReadContentIdKey).subscribe((value) => {
      content.lastReadContentId = value;
      if (content.lastReadContentId) {
        this.events.publish('course:resume', {
          content: content
        });
      } else {
        this.router.navigate([RouterLinks.ENROLLED_COURSE_DETAILS], {
          state: {
            content: content
          }
        });
      }
    });
  }
  getContentState(course: any) {
    const request: GetContentStateRequest = {
      userId: course['userId'],
      courseIds: [course['contentId']],
      returnRefreshedContentStates: true,
      batchId: course['batchId']
    };
    this.courseService.getContentState(request).subscribe();
  }
  ngOnInit() {
    if (this.type === 'enrolledCourse') {
      this.content.cProgress = this.courseUtilService.getCourseProgress(this.content.leafNodesCount, this.content.progress);
      this.content.cProgress = parseInt(this.content.cProgress, 10);
    }
    this.checkBatchExpiry();
  }

  checkBatchExpiry() {
    if (this.content.batch && this.content.batch.status === 2) {
      this.batchExp = true;
    } else {
      this.batchExp = false;
    }
  }

  /**
   * To get enrolled course(s) of logged-in user.
   *
   * It internally calls course handler of genie sdk
   */
  getEnrolledCourses(refreshEnrolledCourses: boolean = true, returnRefreshedCourses: boolean = false): void {

    const option: FetchEnrolledCourseRequest = {
      userId: this.userId,
      returnFreshCourses: returnRefreshedCourses
    };
    this.courseService.getEnrolledCourses(option).toPromise()
      .then((enrolledCourses) => {
        if (enrolledCourses) {
          this.zone.run(() => {
            this.enrolledCourses = enrolledCourses ? enrolledCourses : [];
            if (this.enrolledCourses.length > 0) {
              const courseList: Array<Course> = [];
              for (const course of this.enrolledCourses) {
                courseList.push(course);
              }

              this.appGlobalService.setEnrolledCourseList(courseList);
            }

            this.showLoader = false;
          });
        }
      }, (err) => {
        this.showLoader = false;
      });
  }
}
