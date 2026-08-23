import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Admin from "@/pages/Admin";
import Home from "@/pages/Home";
import Leaderboard from "@/pages/Leaderboard";
import Legal from "@/pages/Legal";
import Support from "@/pages/Support";
import NotFound from "@/pages/NotFound";
import Pricing from "@/pages/Pricing";
import Profile from "./pages/Profile";
import Practice from "./pages/Practice";
import QuizLibrary from "@/pages/QuizLibrary";
import QuizResult from "@/pages/QuizResult";
import QuizRunner from "@/pages/QuizRunner";
import Wallet from "@/pages/Wallet";
import Referral from "@/pages/Referral";
import TopUp from "@/pages/TopUp";
import PaymentStatus from "@/pages/PaymentStatus";
import UserQuizCreator from "@/pages/UserQuizCreator";
import MyQuizzes from "@/pages/MyQuizzes";
import AIStudyAssistant from "@/pages/AIStudyAssistant";
import Missions from "@/pages/Missions";
import Achievements from "@/pages/Achievements";
import AccountLayout from "@/components/AccountLayout";
import AiPointPreflightNotice from "@/components/AiPointPreflightNotice";
import AppearanceStyleBridge from "@/components/AppearanceStyleBridge";
import GamificationCelebrationPopups from "@/components/GamificationCelebrationPopups";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import { LEGACY_ROUTE_MAP, ROUTES } from "@/lib/routes";
import { Route, Switch, useLocation, useSearch } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  const [location] = useLocation();
  const hidePublicFooter = location.startsWith("/admin") || location === ROUTES.quizBuilder || location.startsWith(`${ROUTES.quiz}/`) || location.startsWith(ROUTES.results) || location.startsWith(ROUTES.practice);
  return <><Switch>
    <Route path={ROUTES.home} component={Home} />
    <Route path={ROUTES.explore}>{() => <LearnerAccountPage Page={QuizLibrary} />}</Route>
    <Route path={ROUTES.quizBuilder} component={UserQuizCreator} />
    <Route path={`${ROUTES.results}/:id`} component={QuizResult} />
    <Route path={`${ROUTES.quiz}/:id`} component={QuizRunner} />
    <Route path={ROUTES.leaderboard}>{() => <LearnerAccountPage Page={Leaderboard} />}</Route>
    <Route path={ROUTES.pricing} component={Pricing} />
    <Route path={ROUTES.account} component={Profile} />
    <Route path={ROUTES.missions}>{() => <LearnerAccountPage Page={Missions} />}</Route>
    <Route path={ROUTES.achievements}>{() => <LearnerAccountPage Page={Achievements} />}</Route>
    <Route path={ROUTES.wallet}>{() => <LearnerAccountPage Page={Wallet} />}</Route>
    <Route path={ROUTES.referrals}>{() => <LearnerAccountPage Page={Referral} />}</Route>
    <Route path={ROUTES.billing}>{() => <LearnerAccountPage Page={TopUp} />}</Route>
    <Route path={ROUTES.paymentStatus} component={PaymentStatus} />
    <Route path={ROUTES.practice} component={Practice} />
    <Route path={ROUTES.myQuizzes} component={MyQuizzes} />
    <Route path={ROUTES.aiAssistant}>{() => <LearnerAccountPage Page={AIStudyAssistant} />}</Route>
    <Route path={ROUTES.terms}>{() => <Legal document="terms" />}</Route>
    <Route path={ROUTES.privacy}>{() => <Legal document="privacy" />}</Route>
    <Route path={ROUTES.support} component={Support} />
    <Route path={ROUTES.admin} component={Admin} />
    <Route path={ROUTES.adminDashboard} component={Admin} />
    <Route path={ROUTES.adminTopics} component={Admin} />
    <Route path={ROUTES.adminQuizzes} component={Admin} />
    <Route path={ROUTES.adminContent} component={Admin} />
    <Route path={ROUTES.adminQuestions} component={Admin} />
    <Route path={ROUTES.adminRandomGenerator} component={Admin} />
    <Route path={ROUTES.adminImportExport} component={Admin} />
    <Route path={ROUTES.adminPoints} component={Admin} />
    <Route path={ROUTES.adminXp} component={Admin} />
    <Route path={ROUTES.adminGamification} component={Admin} />
    <Route path={ROUTES.adminUsers} component={Admin} />
    <Route path={ROUTES.adminUserGroups} component={Admin} />
    <Route path={ROUTES.adminErrors} component={Admin} />
    <Route path={ROUTES.adminAnalytics} component={Admin} />
    <Route path={ROUTES.adminSeoPreview} component={Admin} />
    <Route path={ROUTES.adminMonitoring} component={Admin} />
    <Route path={ROUTES.adminLogs} component={Admin} />
    <Route path={ROUTES.adminAi} component={Admin} />
    <Route path={ROUTES.adminTheme} component={Admin} />
    <Route path={ROUTES.adminSettings} component={Admin} />
    <Route path="/ket-qua/:id">{params => <LegacyRedirect to={`${ROUTES.results}/${params.id}`} />}</Route>
    {Object.entries(LEGACY_ROUTE_MAP).map(([legacyPath, target]) => <Route key={legacyPath} path={legacyPath}>{() => <LegacyRedirect to={target} />}</Route>)}
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>{!hidePublicFooter ? <PublicSiteFooter /> : null}</>;
}

function LegacyRedirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  const search = useSearch();
  useEffect(() => { setLocation(`${to}${search}`, { replace: true }); }, [search, setLocation, to]);
  return null;
}

function LearnerAccountPage({ Page }: { Page: React.ComponentType }) {
  return <AccountLayout><div className="account-embedded"><Page /></div></AccountLayout>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><AppearanceStyleBridge /><Toaster /><GamificationCelebrationPopups /><AiPointPreflightNotice /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
