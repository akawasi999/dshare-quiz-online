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
import PersonalInfo from "@/pages/PersonalInfo";
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
import AppearanceStyleBridge from "@/components/AppearanceStyleBridge";
import GamificationCelebrationPopups from "@/components/GamificationCelebrationPopups";
import PublicSiteFooter from "@/components/PublicSiteFooter";
import RouteAccessGuard, { type RouteAccess } from "@/components/RouteAccessGuard";
import { AuthGateProvider } from "@/contexts/AuthGateContext";
import { ROUTES } from "@/lib/routes";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  const [location] = useLocation();
  const accountWorkspaceRoutes = [ROUTES.account, ROUTES.dashboard, ROUTES.leaderboard, ROUTES.missions, ROUTES.achievements, ROUTES.wallet, ROUTES.referrals, ROUTES.billing, ROUTES.myQuizzes, ROUTES.aiAssistant, ROUTES.practice, ROUTES.practiceReview];
  const hidePublicFooter = location.startsWith("/admin") || accountWorkspaceRoutes.some(route => location === route) || location === ROUTES.quizBuilder || location === "/quiz/create" || location.startsWith(`${ROUTES.quiz}/`) || location.startsWith(ROUTES.results) || location.startsWith(ROUTES.practice);
  return <><Switch>
    <Route path={ROUTES.home} component={Home} />
    <Route path={ROUTES.explore}>{() => <QuizLibrary />}</Route>
    <Route path="/quiz/create">{() => <LegacyQuizBuilderRedirect />}</Route>
    <Route path={ROUTES.quizBuilder}>{() => <ProtectedPage Page={UserQuizCreator} />}</Route>
    <Route path={`${ROUTES.results}/:id`}>{() => <ProtectedPage Page={QuizResult} />}</Route>
    <Route path={`${ROUTES.quiz}/:id`}>{() => <ProtectedPage Page={QuizRunner} />}</Route>
    <Route path={ROUTES.leaderboard}>{() => <LearnerAccountPage Page={Leaderboard} />}</Route>
    <Route path={ROUTES.pricing} component={Pricing} />
    <Route path={ROUTES.account}>{() => <ProtectedPage Page={PersonalInfo} />}</Route>
    <Route path={ROUTES.dashboard}>{() => <ProtectedPage Page={Profile} />}</Route>
    <Route path={ROUTES.missions}>{() => <LearnerAccountPage Page={Missions} access="authenticated" />}</Route>
    <Route path={ROUTES.achievements}>{() => <LearnerAccountPage Page={Achievements} access="authenticated" />}</Route>
    <Route path={ROUTES.wallet}>{() => <LearnerAccountPage Page={Wallet} access="authenticated" />}</Route>
    <Route path={ROUTES.referrals}>{() => <LearnerAccountPage Page={Referral} access="authenticated" />}</Route>
    <Route path={ROUTES.billing}>{() => <LearnerAccountPage Page={TopUp} access="authenticated" />}</Route>
    <Route path={ROUTES.paymentStatus}>{() => <ProtectedPage Page={PaymentStatus} />}</Route>
    <Route path={ROUTES.practiceReview}>{() => <LearnerAccountPage Page={Practice} access="authenticated" />}</Route>
    <Route path={ROUTES.practice}>{() => <LearnerAccountPage Page={PracticeQuizLibrary} access="authenticated" />}</Route>
    <Route path={ROUTES.myQuizzes}>{() => <ProtectedPage Page={MyQuizzes} />}</Route>
    <Route path={ROUTES.aiAssistant}>{() => <LearnerAccountPage Page={AIStudyAssistant} access="authenticated" />}</Route>
    <Route path={ROUTES.terms}>{() => <Legal document="terms" />}</Route>
    <Route path={ROUTES.privacy}>{() => <Legal document="privacy" />}</Route>
    <Route path={ROUTES.support} component={Support} />
    <Route path={ROUTES.admin}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminDashboard}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminTopics}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminQuizzes}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminContent}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminQuestions}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminRandomGenerator}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminImportExport}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminPoints}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminXp}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminGamification}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminUsers}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminUserGroups}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminErrors}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminAnalytics}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminSeoPreview}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminMonitoring}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminLogs}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminAi}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminTheme}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path={ROUTES.adminSettings}>{() => <ProtectedPage Page={Admin} access="admin" />}</Route>
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>{!hidePublicFooter ? <PublicSiteFooter /> : null}</>;
}

function ProtectedPage({ Page, access = "authenticated" }: { Page: React.ComponentType; access?: RouteAccess }) {
  return <RouteAccessGuard access={access}><Page /></RouteAccessGuard>;
}

function LearnerAccountPage({ Page, access }: { Page: React.ComponentType; access?: RouteAccess }) {
  const body = <AccountLayout><div className="account-embedded"><Page /></div></AccountLayout>;
  return access ? <RouteAccessGuard access={access}>{body}</RouteAccessGuard> : body;
}

function PracticeQuizLibrary() {
  return <QuizLibrary embedded />;
}

function LegacyQuizBuilderRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation(`${ROUTES.quizBuilder}${window.location.search}`, { replace: true }); }, [setLocation]);
  return null;
}

const deprecatedHrefTargets: Record<string, string> = {
  "/explore": ROUTES.explore, "/kham-pha": ROUTES.explore, "/bang-xep-hang": ROUTES.leaderboard, "/xep-hang": ROUTES.leaderboard, "/bang-gia": ROUTES.pricing,
  "/ho-so": ROUTES.dashboard, "/nhiem-vu": ROUTES.missions, "/thanh-tich": ROUTES.achievements, "/vi": ROUTES.wallet, "/vi-point": ROUTES.wallet,
  "/gioi-thieu": ROUTES.referrals, "/nap-point": ROUTES.billing, "/thanh-toan": ROUTES.paymentStatus, "/luyen-tap": ROUTES.practice,
  "/tao-quiz": ROUTES.quizBuilder, "/quiz/create": ROUTES.quizBuilder, "/quiz-cua-toi": ROUTES.myQuizzes, "/tro-ly-ai": ROUTES.aiAssistant, "/ket-qua": ROUTES.results,
  "/quan-tri": ROUTES.admin, "/quan-tri/chu-de": ROUTES.adminTopics, "/quan-tri/quiz-system": ROUTES.adminQuizzes, "/quan-tri/nguoi-dung": ROUTES.adminUsers,
  "/quan-tri/nhom-nguoi-dung": ROUTES.adminUserGroups, "/quan-tri/point": ROUTES.adminPoints, "/quan-tri/xp": ROUTES.adminXp,
  "/quan-tri/gamification": ROUTES.adminGamification, "/quan-tri/bao-cao": ROUTES.adminAnalytics, "/quan-tri/seo-preview": ROUTES.adminSeoPreview,
  "/quan-tri/live-monitoring": ROUTES.adminMonitoring, "/quan-tri/bao-loi": ROUTES.adminErrors, "/quan-tri/nhat-ky": ROUTES.adminLogs,
  "/quan-tri/thuong-hieu": ROUTES.adminTheme, "/quan-tri/ai-assistant": ROUTES.adminAi, "/quan-tri/cai-dat": ROUTES.adminSettings,
};

function DirectLinkNormalizer() {
  useEffect(() => {
    const normalize = (href: string) => {
      if (!href.startsWith("/")) return href;
      const [pathname, suffix = ""] = href.split(/(?=[?#])/);
      return `${deprecatedHrefTargets[pathname] ?? pathname}${suffix}`;
    };
    const update = (root: ParentNode = document) => root.querySelectorAll<HTMLAnchorElement>("a[href]").forEach(anchor => {
      const nextHref = normalize(anchor.getAttribute("href") ?? "");
      if (nextHref !== anchor.getAttribute("href")) anchor.setAttribute("href", nextHref);
    });
    update();
    const observer = new MutationObserver(() => update());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><AuthGateProvider><AppearanceStyleBridge /><Toaster position="top-right" /><GamificationCelebrationPopups /><DirectLinkNormalizer /><Router /></AuthGateProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
