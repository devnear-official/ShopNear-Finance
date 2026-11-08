import { connectDB } from '../db/connect';
import { BusinessProfile, IBusinessProfile } from '../models/business-profile.model';
import { SystemSettings, ISystemSettings } from '../models/system-settings.model';
import { AuditService } from './audit.service';

export interface UpdateBusinessProfileInput {
  name?: string;
  legalName?: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  tinBin?: string;
  currency?: string;
  currencySymbol?: string;
  fiscalYearStartMonth?: number;
  invoicePrefix?: string;
  billPrefix?: string;
  receiptPrefix?: string;
  voucherPrefix?: string;
  timezone?: string;
}

export interface UpdateSystemSettingsInput {
  makerCheckerEnabled?: boolean;
  approvalThresholdPaisa?: number;
  allowNegativeCash?: boolean;
  autoLockClosedPeriods?: boolean;
  defaultLoanInterestRate?: number;
  loginRateLimitAttempts?: number;
}

export class SettingsService {
  /**
   * Get business profile (creates default if none exists)
   */
  static async getBusinessProfile(): Promise<IBusinessProfile> {
    await connectDB();
    let profile = await BusinessProfile.findOne();
    if (!profile) {
      profile = await BusinessProfile.create({});
    }
    return profile;
  }

  /**
   * Update business profile with audit trail
   */
  static async updateBusinessProfile(
    input: UpdateBusinessProfileInput,
    userId: string
  ): Promise<IBusinessProfile> {
    await connectDB();
    let profile = await BusinessProfile.findOne();
    const before = profile ? profile.toObject() : {};

    if (!profile) {
      profile = new BusinessProfile({ ...input, updatedBy: userId });
    } else {
      Object.assign(profile, input);
      profile.updatedBy = userId as any;
    }

    await profile.save();

    await AuditService.log({
      actorId: userId,
      action: 'UPDATE_BUSINESS_PROFILE',
      entityType: 'BusinessProfile',
      entityId: profile._id.toString(),
      before: before as any,
      after: profile.toObject() as any,
    });

    return profile;
  }

  /**
   * Get system settings (creates default if none exists)
   */
  static async getSystemSettings(): Promise<ISystemSettings> {
    await connectDB();
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    return settings;
  }

  /**
   * Update system settings with audit trail
   */
  static async updateSystemSettings(
    input: UpdateSystemSettingsInput,
    userId: string
  ): Promise<ISystemSettings> {
    await connectDB();
    let settings = await SystemSettings.findOne();
    const before = settings ? settings.toObject() : {};

    if (!settings) {
      settings = new SystemSettings({ ...input, updatedBy: userId });
    } else {
      Object.assign(settings, input);
      settings.updatedBy = userId as any;
    }

    await settings.save();

    await AuditService.log({
      actorId: userId,
      action: 'UPDATE_SYSTEM_SETTINGS',
      entityType: 'SystemSettings',
      entityId: settings._id.toString(),
      before: before as any,
      after: settings.toObject() as any,
    });

    return settings;
  }
}
