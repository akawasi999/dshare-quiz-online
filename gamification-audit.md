# Audit Gamification và kiến trúc nâng cấp

## Hiện trạng kiến trúc

Dshare Quiz Online dùng **React 19, tRPC, Express, Drizzle MySQL/TiDB** và Manus OAuth. Các thao tác dữ liệu đi qua `server/routers.ts`; các luồng điểm, lượt làm và ví tập trung tại `server/db.ts`. Giao diện học viên dùng `AccountLayout`, giao diện CPanel dùng `DashboardLayout`; hai nền tảng này có thể tái sử dụng trực tiếp cho Learning Dashboard và các mô-đun quản trị Gamification.

| Năng lực hiện có | Tái sử dụng | Khoảng trống cần xử lý |
| --- | --- | --- |
| Point wallet và `walletTransactions` | Có số dư, ledger, PayOS fulfillment, kiểm soát phí quiz | Ledger thiếu `balanceBefore`, chưa có action AI/premium mở rộng và cấu hình giá động |
| XP | Có `xpLevels`, `xpRules`, `xpTransactions`, admin XP panel | Chưa phát XP khi hoàn thành học tập; không có số dư/profile snapshot hay idempotency bằng unique reference |
| Quiz/attempt | Chấm điểm máy chủ, trạng thái attempt, chống thao tác sau nộp | Reward Point hiện có cần bao trong transaction và nối với XP/missions/achievements |
| User profile | Hồ sơ, Point, thống kê attempt, layout responsive | Chưa có level, streak, badges, missions, unlocks hoặc XP history |
| Leaderboard | Global/per-quiz theo điểm tốt nhất | Chưa có XP ranking, kỳ tuần/tháng hay Level/badge |
| Admin | XP rule/level, Point ledger, dashboard analytics, audit log | Chưa quản trị missions, achievements, badges, unlock features, hoặc pricing rules |

## Rủi ro và nguyên tắc refactor

Point và XP phải tiếp tục là hai luồng độc lập. Point chỉ thay đổi bằng ví/ledger và nghiệp vụ thanh toán hoặc dịch vụ premium; XP chỉ được phát ở máy chủ dựa trên hoạt động học tập. Không thay đổi hoặc xóa dữ liệu lịch sử. Các reward dựa vào `attemptId`, `missionAssignmentId`, `achievementId` hoặc request id để bảo đảm idempotent. Không suy diễn reward ở client.

## Kiến trúc Gamification mục tiêu

| Miền nghiệp vụ | Bảng/chức năng mới | Quy tắc chính |
| --- | --- | --- |
| Progression | Bổ sung `xpBalance`, `currentLevelId`, `currentStreak`, `longestStreak`, `lastLearningDate` vào learner profile | Profile là snapshot; `xpTransactions` là ledger nguồn sự thật |
| XP ledger | Bổ sung khóa idempotency theo `sourceType/sourceId/ruleId` | Một source chỉ nhận một reward cho mỗi rule; cấp XP trong transaction cùng cập nhật snapshot |
| Feature unlock | `gamificationFeatures`, `levelFeatureUnlocks` | Feature code động, required level, mô tả lock; không hard-code điều kiện trong UI |
| Missions | `missionDefinitions`, `userMissionAssignments` | Repeat daily/weekly/special, mục tiêu, tiến độ, hạn dùng và reward XP; assignment có unique user/mission/period |
| Streak | `streakRewardMilestones`, `streakRewardClaims` | Hoạt động học hợp lệ cập nhật streak theo ngày; mốc thưởng claim idempotent |
| Achievements/badges | `achievements`, `userAchievements`, `badges`, `userBadges` | Điều kiện cấu hình, mở khóa một lần, XP reward và badge liên kết |
| Economy | `pointPriceRules` | Action pricing động để AI/quiz/premium feature dùng chung một contract |
| Analytics | mở rộng aggregate theo XP, missions, streak và achievements | Chỉ đọc ledger/attempt để tránh số liệu client-side |

## Lộ trình triển khai an toàn

1. **Foundation:** migration additive, XP snapshot/ledger idempotent, feature unlock và rule service dùng lại được.
2. **Progression:** mission assignment theo truy cập ngày, streak, achievement/badge evaluator; không cần timer in-process.
3. **Quiz & economy:** tích hợp reward atomically vào `submitAttempt`, bổ sung pricing rule và AI debit/refund transaction.
4. **Trải nghiệm:** Learning Dashboard, Wallet kép Point/XP, Mission/Achievement pages, leaderboard XP và result reward summary.
5. **CPanel & analytics:** CRUD cấu hình cấp độ, rules, missions, achievements/badges/unlocks/pricing; báo cáo progression.
6. **Hardening:** test transaction/duplicate/race/refund, responsive, accessibility và visual verification.

## Quyết định về nhiệm vụ lặp lại

Daily missions không dùng timer chạy trong ứng dụng. Mỗi lần người học mở Learning Dashboard hoặc tạo hoạt động học, server sẽ xác định chu kỳ UTC đang hiệu lực, idempotently tạo assignment còn thiếu và cập nhật progress. Cách này hoạt động trên hạ tầng autoscale, không cần tiến trình chạy nền, đồng thời tránh phát thưởng trùng lặp.
