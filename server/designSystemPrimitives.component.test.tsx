// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { Badge } from "../client/src/components/ui/badge";
import { Button } from "../client/src/components/ui/button";
import { Card } from "../client/src/components/ui/card";
import { Input } from "../client/src/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../client/src/components/ui/tabs";

describe("design system primitives", () => {
  it("cung cấp token semantic theo đặc tả UI", () => {
    const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
    expect(css).toContain("--primary: #635bff");
    expect(css).toContain("--accent: #7c5cfc");
    expect(css).toContain("--background: #f8fafc");
    expect(css).toContain("--radius-lg-token: 16px");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("chuẩn hóa Button, Card, Input, Badge và Tabs với state truy cập được", () => {
    render(<div><Button>Tiếp tục</Button><Button variant="outline">Quay lại</Button><Input aria-label="Tên Quiz" /><Badge variant="success">Đã lưu</Badge><Card data-testid="surface">Nội dung</Card><Tabs defaultValue="one"><TabsList><TabsTrigger value="one">Một</TabsTrigger><TabsTrigger value="two">Hai</TabsTrigger></TabsList></Tabs></div>);
    expect(screen.getByRole("button", { name: "Tiếp tục" }).className).toContain("h-11");
    expect(screen.getByRole("button", { name: "Tiếp tục" }).className).toContain("focus-visible:ring-4");
    expect(screen.getByLabelText("Tên Quiz").className).toContain("h-11");
    expect(screen.getByText("Đã lưu").className).toContain("bg-success/12");
    expect(screen.getByTestId("surface").className).toContain("rounded-[var(--radius-lg-token)]");
    expect(screen.getByRole("tab", { name: "Một" }).className).toContain("data-[state=active]:text-primary");
  });
});
