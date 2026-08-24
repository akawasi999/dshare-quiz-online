import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { accountStatusMessage, hasRolePermission, type PermissionKey } from "../../shared/accessControl";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  const accountStatus = ctx.user.accountStatus ?? "active";
  if (accountStatus !== "active") {
    throw new TRPCError({ code: "FORBIDDEN", message: accountStatusMessage(accountStatus) });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const permissionProcedure = (permission: PermissionKey): typeof protectedProcedure => protectedProcedure.use(
  t.middleware(async opts => {
    if (!opts.ctx.user || !hasRolePermission(opts.ctx.user.role, permission)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Bạn không có quyền sử dụng chức năng này." });
    }
    return opts.next({ ctx: { ...opts.ctx, user: opts.ctx.user } });
  }),
) as typeof protectedProcedure;

export const adminProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
