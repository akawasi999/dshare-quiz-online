import QuizCard from "@/components/QuizCard";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { useAuth } from "@/_core/hooks/useAuth";
import type { ShowcaseQuiz } from "@/data/demo";
import { ROUTES } from "@/lib/routes";
import { trpc } from "@/lib/trpc";
import { sharedDataQueryOptions } from "@/lib/sharedDataSync";
import { cn } from "@/lib/utils";
import { withTrendingStatus } from "@shared/quizTrending";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Code2,
  Filter,
  GraduationCap,
  Languages,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

const difficultyLabels = {
  easy: "Dễ",
  medium: "Trung bình",
  hard: "Nâng cao",
} as const;
const tierLabels = { basic: "Basic", pro: "Pro", premium: "Premium" } as const;
const libraryPreferenceKey = "dshare-quiz-library-preferences";
type LibraryPreferences = { topicId: number | null; difficulty: string };
const defaultLibraryPreferences: LibraryPreferences = {
  topicId: null,
  difficulty: "Tất cả",
};

function getPageItems(currentPage: number, totalPages: number) {
  if (totalPages <= 8)
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 4)
    return [
      ...Array.from({ length: 8 }, (_, index) => index + 1),
      "end-ellipsis",
      totalPages,
    ] as const;
  if (currentPage >= totalPages - 3)
    return [
      1,
      "start-ellipsis",
      ...Array.from({ length: 8 }, (_, index) => totalPages - 7 + index),
    ] as const;
  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ] as const;
}

function getCategoryIcon(category: string) {
  const normalized = category.toLocaleLowerCase("vi-VN");
  if (category === "Tất cả") return Sparkles;
  if (
    normalized.includes("công nghệ") ||
    normalized.includes("tin học") ||
    normalized.includes("ic3")
  )
    return Code2;
  if (
    normalized.includes("ngoại ngữ") ||
    normalized.includes("tiếng") ||
    normalized.includes("ielts")
  )
    return Languages;
  return normalized.includes("kỹ năng") || normalized.includes("chứng chỉ")
    ? GraduationCap
    : BookOpen;
}

function loadLibraryPreferences() {
  if (typeof window === "undefined") return defaultLibraryPreferences;
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(libraryPreferenceKey) ?? "{}"
    ) as Partial<LibraryPreferences>;
    return {
      topicId:
        typeof saved.topicId === "number" && saved.topicId > 0
          ? saved.topicId
          : null,
      difficulty:
        typeof saved.difficulty === "string"
          ? saved.difficulty
          : defaultLibraryPreferences.difficulty,
    };
  } catch {
    return defaultLibraryPreferences;
  }
}

function getTopicIdFromLocation(location: string) {
  const topicValue = new URLSearchParams(location.split("?")[1] ?? "").get(
    "topic"
  );
  const topicId = Number(topicValue);
  return Number.isInteger(topicId) && topicId > 0 ? topicId : null;
}

export default function QuizLibrary({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const quizzesPerPage = embedded ? 12 : 24;
  const savedPreferences = loadLibraryPreferences();
  const [location] = useLocation();
  const requestedTopicId = getTopicIdFromLocation(location);
  const { user } = useAuth();
  const learner = trpc.learner.summary.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
    ...sharedDataQueryOptions,
  });
  const quota = trpc.learner.quota?.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
    ...sharedDataQueryOptions,
  }) ?? { data: undefined };
  const categories = trpc.catalog.topics.useQuery(
    undefined,
    sharedDataQueryOptions
  );
  const catalog = trpc.catalog.list.useQuery(undefined, sharedDataQueryOptions);
  const [selectedTopicId, setSelectedTopicId] = useState(
    requestedTopicId ?? savedPreferences.topicId
  );
  const [difficulty, setDifficulty] = useState(savedPreferences.difficulty);
  const [currentPage, setCurrentPage] = useState(1);
  const categoryListRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasStartedExploring, setHasStartedExploring] = useState(
    Boolean(
      savedPreferences.topicId !== null ||
        savedPreferences.difficulty !== "Tất cả"
    )
  );
  const suggestedCategory = categories.data?.find(
    item => item.id === learner.data?.profile.lastPracticeCategoryId
  );
  const topicFilters = (categories.data ?? []).filter(item => item.depth === 0);
  useEffect(() => {
    if (
      requestedTopicId !== null &&
      topicFilters.some(topic => topic.id === requestedTopicId)
    )
      setSelectedTopicId(requestedTopicId);
  }, [requestedTopicId, topicFilters]);
  const attemptLimit = quota.data?.limits.attemptsPerMonth;
  const usedAttempts = quota.data?.usage.attempts ?? 0;
  const hasUnlimitedAttempts = attemptLimit === null;
  const quotaProgress =
    attemptLimit && attemptLimit > 0
      ? Math.min(100, Math.round((usedAttempts / attemptLimit) * 100))
      : 0;
  const remainingAttempts = quota.data?.remaining.attempts ?? attemptLimit ?? 0;
  const shouldShowUpgrade =
    !hasUnlimitedAttempts &&
    attemptLimit !== undefined &&
    remainingAttempts <= Math.max(2, Math.ceil(attemptLimit * 0.2));
  const liveQuizzes = useMemo<
    (ShowcaseQuiz & { rootTopicId: number | null })[]
  >(
    () =>
      withTrendingStatus(
        (catalog.data ?? []).map(quiz => ({
          id: quiz.quizId,
          title: quiz.title,
          category:
            quiz.rootTopicTitle ??
            quiz.topicTitle ??
            quiz.categoryTitle ??
            "Chưa phân loại",
          subject: quiz.subjectTitle ?? "",
          lesson: quiz.lessonTitle ?? "",
          topicPath:
            quiz.topicPath ??
            ([quiz.rootTopicTitle, quiz.topicTitle]
              .filter(Boolean)
              .join(" › ") ||
              quiz.categoryTitle ||
              "Chưa phân loại"),
          summary: quiz.summary ?? "Bộ đề đã được biên soạn trong Dshare.",
          mode:
            quiz.mode === "testing"
              ? ("Kiểm tra" as const)
              : ("Ôn tập" as const),
          difficulty: difficultyLabels[quiz.difficulty],
          duration: `${Math.ceil(quiz.durationSeconds / 60)} phút`,
          questionCount: quiz.questionCount,
          accent: "var(--primary)",
          points: quiz.entryPointCost,
          reward: quiz.completionReward,
          attemptCount: Number(quiz.attemptCount ?? 0),
          recentAttemptCount: Number(quiz.recentAttemptCount ?? 0),
          createdAt: quiz.createdAt,
          coverImage: quiz.coverImageUrl ?? undefined,
          authorName: quiz.creatorName ?? undefined,
          tier: tierLabels[quiz.accessTier],
          rootTopicId: quiz.rootTopicId ?? null,
        }))
      ),
    [catalog.data]
  );
  const topicCounts = useMemo(
    () =>
      liveQuizzes.reduce<Record<number, number>>(
        (counts, quiz) =>
          quiz.rootTopicId
            ? {
                ...counts,
                [quiz.rootTopicId]: (counts[quiz.rootTopicId] ?? 0) + 1,
              }
            : counts,
        {}
      ),
    [liveQuizzes]
  );
  const filtered = useMemo(
    () =>
      liveQuizzes.filter(
        quiz =>
          (selectedTopicId === null || quiz.rootTopicId === selectedTopicId) &&
          (difficulty === "Tất cả" || quiz.difficulty === difficulty)
      ),
    [liveQuizzes, selectedTopicId, difficulty]
  );
  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (left, right) =>
          (right.createdAt?.getTime() ?? 0) - (left.createdAt?.getTime() ?? 0)
      ),
    [filtered]
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / quizzesPerPage));
  const pageItems = useMemo(
    () => getPageItems(currentPage, totalPages),
    [currentPage, totalPages]
  );
  const paginatedQuizzes = useMemo(
    () =>
      sorted.slice(
        (currentPage - 1) * quizzesPerPage,
        currentPage * quizzesPerPage
      ),
    [currentPage, sorted, quizzesPerPage]
  );

  useEffect(() => {
    window.localStorage.setItem(
      libraryPreferenceKey,
      JSON.stringify({
        topicId: selectedTopicId,
        difficulty,
      } satisfies LibraryPreferences)
    );
  }, [selectedTopicId, difficulty]);
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTopicId, difficulty]);
  useEffect(() => {
    setCurrentPage(page => Math.min(Math.max(1, page), totalPages));
  }, [totalPages]);
  useEffect(() => {
    const list = categoryListRef.current;
    if (!list) return;
    const updateScrollState = () => {
      setCanScrollLeft(list.scrollLeft > 2);
      setCanScrollRight(
        list.scrollLeft + list.clientWidth < list.scrollWidth - 2
      );
    };
    updateScrollState();
    list.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      list.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [topicFilters.length]);
  const scrollCategories = (direction: "left" | "right") =>
    categoryListRef.current?.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });

  return (
    <div
      className={
        embedded ? "min-h-full bg-background" : "min-h-screen bg-background"
      }
    >
      {!embedded ? <SiteHeader /> : null}
      <section className="border-b border-border-light bg-surface">
        <div className="container py-5">
          <div className="rounded-[var(--radius-lg-token)] border border-primary/15 bg-primary-light px-5 py-4 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 place-items-center rounded-[var(--radius-md-token)] bg-primary text-primary-foreground">
                <Sparkles size={19} />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {hasUnlimitedAttempts
                    ? "Bạn có lượt làm Quiz không giới hạn"
                    : `Bạn còn ${quota.data?.remaining.attempts ?? "—"} lượt làm Quiz tháng này`}
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Theo gói {quota.data?.tier?.toUpperCase() ?? "BASIC"}.
                </p>
              </div>
            </div>
            <div className="mt-3 flex w-full items-end gap-3 sm:mt-0 sm:w-auto">
              <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
                <div className="mb-1.5 flex justify-end text-[10px] font-bold uppercase tracking-[.1em] text-primary">
                  <span>
                    {hasUnlimitedAttempts
                      ? "∞"
                      : `${usedAttempts}/${attemptLimit ?? 0}`}
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-surface"
                  role="progressbar"
                  aria-label="Tiến độ lượt làm Quiz"
                  aria-valuemin={0}
                  aria-valuemax={
                    hasUnlimitedAttempts ? undefined : (attemptLimit ?? 0)
                  }
                  aria-valuenow={
                    hasUnlimitedAttempts ? undefined : usedAttempts
                  }
                >
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-300"
                    style={{
                      width: `${hasUnlimitedAttempts ? 100 : quotaProgress}%`,
                    }}
                  />
                </div>
              </div>
              {shouldShowUpgrade ? (
                <Button
                  asChild
                  size="sm"
                  className="shrink-0 rounded-full px-4"
                >
                  <Link href={ROUTES.pricing}>
                    Nâng cấp ngay <ArrowRight size={14} />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
      <section className="container py-6 lg:py-8">
        {suggestedCategory && !hasStartedExploring ? (
          <div className="mb-5 flex items-center gap-3 rounded-[var(--radius-md-token)] border border-warning/30 bg-warning/10 px-4 py-3 text-xs leading-5 text-warning">
            <Sparkles size={16} className="shrink-0" />
            <span>
              <strong>Gợi ý từ phiên luyện tập gần nhất:</strong>{" "}
              {suggestedCategory.name}
            </span>
          </div>
        ) : null}
        <div className="rounded-[var(--radius-lg-token)] border border-border bg-surface p-3 shadow-[var(--shadow-sm)]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex shrink-0 items-center gap-1.5 pl-1 text-[10px] font-bold uppercase tracking-[.12em] text-text-muted">
              <Filter aria-hidden="true" size={14} /> Chủ đề
            </div>
            <div className="relative min-w-0 flex-1">
              <div
                ref={categoryListRef}
                className="-mr-1 flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-1 pr-1 [scrollbar-width:thin]"
              >
                <button
                  key="all-topics"
                  aria-pressed={selectedTopicId === null}
                  onClick={() => {
                    setHasStartedExploring(true);
                    setSelectedTopicId(null);
                  }}
                  className={cn(
                    "flex min-h-10 shrink-0 snap-start items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
                    selectedTopicId === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-text-secondary hover:bg-primary-light hover:text-primary"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full",
                      selectedTopicId === null
                        ? "bg-white/20"
                        : "bg-surface text-primary"
                    )}
                  >
                    <Sparkles size={12} />
                  </span>
                  Tất cả
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      selectedTopicId === null
                        ? "bg-white/20 text-white"
                        : "bg-surface text-primary"
                    )}
                  >
                    {liveQuizzes.length}
                  </span>
                </button>
                {topicFilters.map(topic => {
                  const Icon = getCategoryIcon(topic.name);
                  const selected = selectedTopicId === topic.id;
                  return (
                    <button
                      key={topic.id}
                      aria-pressed={selected}
                      onClick={() => {
                        setHasStartedExploring(true);
                        setSelectedTopicId(topic.id);
                      }}
                      className={cn(
                        "flex min-h-10 shrink-0 snap-start items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-text-secondary hover:bg-primary-light hover:text-primary"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded-full",
                          selected ? "bg-white/20" : "bg-surface text-primary"
                        )}
                      >
                        <Icon size={12} />
                      </span>
                      {topic.name}
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                          selected
                            ? "bg-white/20 text-white"
                            : "bg-surface text-primary"
                        )}
                      >
                        {topicCounts[topic.id] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
              {canScrollLeft ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 hidden w-10 bg-gradient-to-r from-surface via-surface/85 to-transparent sm:block"
                />
              ) : null}
              {canScrollRight ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0 hidden w-12 bg-gradient-to-l from-surface via-surface/85 to-transparent sm:block"
                />
              ) : null}
            </div>
            <div className="hidden shrink-0 items-center gap-1 lg:flex">
              <button
                type="button"
                aria-label="Cuộn chủ đề sang trái"
                disabled={!canScrollLeft}
                onClick={() => scrollCategories("left")}
                className="grid size-10 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowLeft size={15} />
              </button>
              <button
                type="button"
                aria-label="Cuộn chủ đề sang phải"
                disabled={!canScrollRight}
                onClick={() => scrollCategories("right")}
                className="grid size-10 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-7 flex justify-center border-b border-border-light pb-5">
          <div className="flex flex-wrap justify-center gap-2">
            {["Tất cả", "Dễ", "Trung bình", "Nâng cao"].map(item => {
              const selected = difficulty === item;
              return (
                <button
                  key={item}
                  aria-pressed={selected}
                  onClick={() => {
                    setHasStartedExploring(true);
                    setDifficulty(item);
                  }}
                  className={cn(
                    "min-h-10 rounded-full border px-4 text-xs font-bold transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-text-secondary hover:bg-primary-light hover:text-primary"
                  )}
                >
                  <>
                    {item === "Tất cả" ? (
                      <Target className="mr-1 inline" size={13} />
                    ) : (
                      <i
                        className={cn(
                          "mr-1 inline-block size-2.5 rounded-full",
                          item === "Dễ"
                            ? "bg-success"
                            : item === "Trung bình"
                              ? "bg-warning"
                              : "bg-danger"
                        )}
                      />
                    )}{" "}
                    {item}
                  </>
                </button>
              );
            })}
          </div>
        </div>
        {catalog.isLoading ? (
          <div
            role="status"
            className="mt-10 rounded-[var(--radius-xl-token)] border border-border bg-surface px-6 py-16 text-center text-sm text-text-secondary"
            aria-live="polite"
          >
            Đang tải bộ đề...
          </div>
        ) : catalog.error ? (
          <div
            role="alert"
            className="mt-10 rounded-[var(--radius-xl-token)] border border-danger/20 bg-danger/5 px-6 py-16 text-center text-sm text-danger"
          >
            <p>Không thể tải thư viện bộ đề: {catalog.error.message}</p>
            <Button
              variant="outline"
              onClick={() => catalog.refetch()}
              className="mt-5 rounded-full border-danger/30 text-danger"
            >
              Thử lại
            </Button>
          </div>
        ) : sorted.length ? (
          <>
            <div id="quiz-list" className="mt-8 grid gap-x-10 md:grid-cols-2">
              {paginatedQuizzes.map(quiz => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
            {totalPages > 1 ? (
              <Pagination className="mt-9">
                <PaginationContent className="max-w-full flex-wrap justify-center gap-1.5">
                  <PaginationItem>
                    <PaginationLink
                      href="#quiz-list"
                      size="default"
                      aria-label="Trang trước"
                      aria-disabled={currentPage === 1}
                      onClick={event => {
                        event.preventDefault();
                        setCurrentPage(page => Math.max(1, page - 1));
                      }}
                      className={cn(
                        "rounded-xl border border-border px-3 text-xs font-bold text-text-secondary hover:bg-muted",
                        currentPage === 1 && "pointer-events-none opacity-40"
                      )}
                    >
                      <ArrowLeft size={14} />
                      <span className="hidden sm:inline">Trước</span>
                    </PaginationLink>
                  </PaginationItem>
                  {pageItems.map((item, index) =>
                    typeof item === "number" ? (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#quiz-list"
                          isActive={item === currentPage}
                          onClick={event => {
                            event.preventDefault();
                            setCurrentPage(item);
                          }}
                          className={cn(
                            "size-9 rounded-xl border text-xs font-bold",
                            item === currentPage
                              ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:bg-primary"
                              : "border-border bg-surface text-text-secondary hover:bg-muted"
                          )}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={`${item}-${index}`}>
                        <PaginationEllipsis className="size-8 text-text-muted" />
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationLink
                      href="#quiz-list"
                      size="default"
                      aria-label="Trang sau"
                      aria-disabled={currentPage === totalPages}
                      onClick={event => {
                        event.preventDefault();
                        setCurrentPage(page => Math.min(totalPages, page + 1));
                      }}
                      className={cn(
                        "rounded-xl border border-border px-3 text-xs font-bold text-text-secondary hover:bg-muted",
                        currentPage === totalPages && "pointer-events-none opacity-40"
                      )}
                    >
                      <span className="hidden sm:inline">Sau</span>
                      <ArrowRight size={14} />
                    </PaginationLink>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : null}
          </>
        ) : (
          <div className="mt-10 rounded-[var(--radius-xl-token)] border border-dashed border-border bg-muted px-6 py-16 text-center">
            <Search
              aria-hidden="true"
              className="mx-auto text-primary"
              size={25}
            />
            <h2 className="mt-4 text-2xl font-bold text-foreground">
              Chưa tìm thấy bộ đề phù hợp
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Thử bỏ bớt bộ lọc để xem thêm bộ đề.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTopicId(null);
                setDifficulty("Tất cả");
              }}
              className="mt-6 rounded-full"
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
