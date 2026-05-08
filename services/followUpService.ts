import { User, UserExposureProgress } from '../types.ts';
import { NotificationService } from './notificationService.ts';
import { getAllUserExposureProgress, saveUser } from '../utils/localStorageDB.ts';

/**
 * Service to analyze patient progress and send personalized follow-up notifications.
 */
export class FollowUpService {
  
  static async checkAndSendProgressFollowUp(user: User, t: any, updateUser: (updates: Partial<User>) => Promise<boolean>) {
    if (user.role !== 'patient' || !user.notificationPreferences?.enabled || !user.notificationPreferences?.followUp) {
      return;
    }

    const allProgress = getAllUserExposureProgress().filter(p => p.userId === user.id);
    if (allProgress.length === 0) return;

    // Get the most recent progress record
    const latestProgress = allProgress.sort((a, b) => b.lastUpdated - a.lastUpdated)[0];
    const sentFollowUps = user.sentFollowUps || [];

    let followUpType: string | null = null;
    let followUpData: any = { username: user.username };

    // 1. First Session Completed
    if (latestProgress.completedVideoIds.length === 1 && !sentFollowUps.includes('firstSession')) {
      followUpType = 'firstSession';
    } 
    // 2. Program Completed (Maintenance)
    else if (latestProgress.programCompleted && !sentFollowUps.includes('maintenanceStarted')) {
       followUpType = 'maintenanceStarted';
    }
    // 3. Halfway (roughly)
    else if (latestProgress.completedVideoIds.length >= Math.ceil(latestProgress.videoSequence.length / 2) && !sentFollowUps.includes('halfway') && !latestProgress.programCompleted) {
       followUpType = 'halfway';
    }
    // 4. Reduced Fear (SUDs improvement)
    else if (latestProgress.discomfortRatings.length >= 3 && !sentFollowUps.includes('reducedFear')) {
       // Look for improvement: compare first rating with latest
       const ratings = latestProgress.discomfortRatings.sort((a, b) => a.videoTimestamp - b.videoTimestamp);
       const firstRating = ratings[0].rating;
       const latestRating = ratings[ratings.length - 1].rating;
       
       if (latestRating <= firstRating - 2) {
           followUpType = 'reducedFear';
           followUpData.firstSuds = firstRating;
           followUpData.latestSuds = latestRating;
       }
    }
    // 5. Most Difficult (e.g., reached the last 20% of the hierarchy)
    else if (latestProgress.currentVideoIndex >= Math.floor(latestProgress.videoSequence.length * 0.8) && !sentFollowUps.includes('mostDifficult') && !latestProgress.programCompleted) {
       followUpType = 'mostDifficult';
    }

    if (followUpType) {
      const message = t(`aiChat.followUp.${followUpType}`, followUpData);
      const title = t('profile.notificationTypes.followUp');
      
      // Send notification
      NotificationService.sendNotification(title, message);
      
      // Update user record to mark this follow-up as sent
      const updatedSentFollowUps = [...sentFollowUps, followUpType];
      await updateUser({ sentFollowUps: updatedSentFollowUps });
      
      console.log(`Sent follow-up notification: ${followUpType} to ${user.username}`);
    }
  }
}
