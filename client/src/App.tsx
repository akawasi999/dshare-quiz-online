import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Admin from "@/pages/Admin";
import Home from "@/pages/Home";
import Leaderboard from "@/pages/Leaderboard";
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
import AccountLayout from "@/components/AccountLayout";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/kham-pha">{() => <LearnerAccountPage Page={QuizLibrary} />}</Route>
    <Route path="/quiz/:id" component={QuizRunner} />
    <Route path="/ket-qua/:id" component={QuizResult} />
    <Route path="/bang-xep-hang">{() => <LearnerAccountPage Page={Leaderboard} />}</Route>
    <Route path="/xep-hang">{() => <LearnerAccountPage Page={Leaderboard} />}</Route>
    <Route path="/bang-gia" component={Pricing} />
    <Route path="/ho-so" component={Profile} />
    <Route path="/vi">{() => <LearnerAccountPage Page={Wallet} />}</Route>
    <Route path="/vi-point">{() => <LearnerAccountPage Page={Wallet} />}</Route>
    <Route path="/gioi-thieu">{() => <LearnerAccountPage Page={Referral} />}</Route>
    <Route path="/nap-point">{() => <LearnerAccountPage Page={TopUp} />}</Route>
    <Route path="/thanh-toan" component={PaymentStatus} />
    <Route path="/luyen-tap" component={Practice} />
    <Route path="/tao-quiz" component={UserQuizCreator} />
    <Route path="/quiz-cua-toi" component={MyQuizzes} />
    <Route path="/tro-ly-ai">{() => <LearnerAccountPage Page={AIStudyAssistant} />}</Route>
    <Route path="/quan-tri" component={Admin} />
    <Route path="/quan-tri/chu-de" component={Admin} />
    <Route path="/quan-tri/quiz-system" component={Admin} />
    <Route path="/quan-tri/noi-dung" component={Admin} />
    <Route path="/quan-tri/cau-hoi" component={Admin} />
    <Route path="/quan-tri/tao-de-ngau-nhien" component={Admin} />
    <Route path="/quan-tri/import-xuat" component={Admin} />
    <Route path="/quan-tri/nguoi-dung" component={Admin} />
    <Route path="/quan-tri/nhom-nguoi-dung" component={Admin} />
    <Route path="/quan-tri/point" component={Admin} />
    <Route path="/quan-tri/xp" component={Admin} />
    <Route path="/quan-tri/bao-cao" component={Admin} />
    <Route path="/quan-tri/live-monitoring" component={Admin} />
    <Route path="/quan-tri/bao-loi" component={Admin} />
    <Route path="/quan-tri/nhat-ky" component={Admin} />
    <Route path="/quan-tri/thuong-hieu" component={Admin} />
    <Route path="/quan-tri/ai-assistant" component={Admin} />
    <Route path="/admin" component={Admin} />
    <Route path="/admin/dashboard" component={Admin} />
    <Route path="/admin/learning/topics" component={Admin} />
    <Route path="/admin/learning/quizzes" component={Admin} />
    <Route path="/admin/learning/content" component={Admin} />
    <Route path="/admin/learning/questions" component={Admin} />
    <Route path="/admin/learning/random-generator" component={Admin} />
    <Route path="/admin/learning/import-export" component={Admin} />
    <Route path="/admin/gamification/points" component={Admin} />
    <Route path="/admin/users" component={Admin} />
    <Route path="/admin/users/groups" component={Admin} />
    <Route path="/admin/moderation/errors" component={Admin} />
    <Route path="/admin/analytics" component={Admin} />
    <Route path="/admin/system/monitoring" component={Admin} />
    <Route path="/admin/system/logs" component={Admin} />
    <Route path="/admin/system/ai" component={Admin} />
    <Route path="/admin/appearance/theme" component={Admin} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function LearnerAccountPage({ Page }: { Page: React.ComponentType }) {
  return <AccountLayout><div className="account-embedded"><Page /></div></AccountLayout>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
