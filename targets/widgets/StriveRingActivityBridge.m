#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(StriveRingActivityBridge, NSObject)

RCT_EXTERN_METHOD(syncSharedState:(NSInteger)dailyStrain
                  target:(NSInteger)target
                  completedSessionsJson:(NSString *)completedSessionsJson)

RCT_EXTERN_METHOD(startActivity:(NSString *)habitId
                  habitName:(NSString *)habitName
                  totalScore:(NSInteger)totalScore
                  target:(NSInteger)target
                  elapsedMs:(double)elapsedMs)

RCT_EXTERN_METHOD(updateActivity:(NSInteger)liveScore
                  totalScore:(NSInteger)totalScore
                  elapsedMs:(double)elapsedMs)

RCT_EXTERN_METHOD(endActivity:(NSInteger)liveScore
                  totalScore:(NSInteger)totalScore
                  elapsedMs:(double)elapsedMs)

@end
