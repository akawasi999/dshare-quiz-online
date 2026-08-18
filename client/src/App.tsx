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
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/kham-pha" component={QuizLibrary} />
    <Route path="/quiz/:id" component={QuizRunner} />
    <Route path="/ket-qua/:id" component={QuizResult} />
    <Route path="/bang-xep-hang" component={Leaderboard} />
    <Route path="/bang-gia" component={Pricing} />
    <Route path="/ho-so" component={Profile} />
    <Route path="/vi" component={Wallet} />
    <Route path="/gioi-thieu" component={Referral} />
    <Route path="/nap-point" component={TopUp} />
    <Route path="/luyen-tap" component={Practice} />
    <Route path="/quan-tri" component={Admin} />
    <Route path="/quan-tri/noi-dung" component={Admin} />
    <Route path="/quan-tri/tao-de-ngau-nhien" component={Admin} />
    <Route path="/quan-tri/cau-hoi" component={Admin} />
    <Route path="/quan-tri/import-xuat" component={Admin} />
    <Route path="/quan-tri/nguoi-dung" component={Admin} />
    <Route path="/quan-tri/point" component={Admin} />
    <Route path="/quan-tri/bao-cao" component={Admin} />
    <Route path="/quan-tri/bao-loi" component={Admin} />
    <Route path="/quan-tri/nhat-ky" component={Admin} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
