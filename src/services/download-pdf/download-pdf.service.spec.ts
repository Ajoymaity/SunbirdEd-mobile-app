import { DownloadPdfService } from './download-pdf.service';
import { AndroidPermissionsService } from '../android-permissions/android-permissions.service';
import { of } from 'rxjs';
import { content } from './download-pdf.data';
import { Content } from '@project-sunbird/sunbird-sdk';

describe('DownloadPdfService', () => {
  let downloadPdfService: DownloadPdfService;
  const mockPermissionService: Partial<AndroidPermissionsService> = {
    checkPermissions: jest.fn(() => of(Boolean)),
    requestPermissions: jest.fn(() => of(Boolean))
  };

  beforeAll(() => {
    downloadPdfService = new DownloadPdfService(
      mockPermissionService as AndroidPermissionsService
    );
  //  jest.spyOn(mockPermissionService, 'checkPermissions')
  //  jest.spyOn(mockPermissionService, 'requestPermissions')
 //  jest.spyOn(window['downloadManager'], 'enqueue')
  });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });


  it('should be created', () => {
    expect(downloadPdfService).toBeTruthy();
  });
  describe('if permission is always denied', () => {
    it('it should reject', () => {
      mockPermissionService.checkPermissions = jest.fn(() => of({isPermissionAlwaysDenied: true }))
      const req = {id: 'sample-id'} as any;
      downloadPdfService.downloadPdf(req).then(() => {
       expect(mockPermissionService.checkPermissions).toHaveBeenCalled();
      });
    });
  });

  describe('if permission is not always denied', () => {
    beforeAll(() => {
      mockPermissionService.checkPermissions = jest.fn(() => of({ isPermissionAlwaysDenied: false }));
    });

    describe('if permission is not allowed', () => {

      describe('if permission granted', () => {
        beforeAll(() => {
          mockPermissionService.checkPermissions = jest.fn(() => of({ isPermissionAlwaysDenied: false, hasPermission: false }));
          mockPermissionService.requestPermissions = jest.fn(() => of({ isPermissionAlwaysDenied: false, hasPermission: true }));
          window['downloadManager']['enqueue'] = jest.fn((downloadRequest, callback) => {
            callback(null, 'sampleid');
          });

        })
        it('should download pdf', () => {
          downloadPdfService.downloadPdf(content as any as Content).then(() => {
            expect(window['downloadManager'].enqueue).toHaveBeenCalled();
          });
        });
      });

      describe('if permission not granted', () => {
        beforeAll(() => {
          mockPermissionService.checkPermissions = jest.fn(() => of({ isPermissionAlwaysDenied: false, hasPermission: false }));
          mockPermissionService.requestPermissions = jest.fn(() => of({ isPermissionAlwaysDenied: false, hasPermission: false }));
        })
        it('should reject ', () => {
          downloadPdfService.downloadPdf(content as any as Content).catch((e) => {
            expect(e).toEqual({ reason: 'user-permission-denied' });
          });
        });
      });
    });
  });
});
