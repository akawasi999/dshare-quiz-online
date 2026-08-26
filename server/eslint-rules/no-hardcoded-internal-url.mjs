const allowedPrefixes = ["/api/", "/manus-storage/", "/__manus__/", "/assets/", "/favicon", "/robots", "/sitemap", "/manifest"];

export const isHardcodedInternalUrl = value => typeof value === "string"
  && value.startsWith("/")
  && !value.startsWith("//")
  && !allowedPrefixes.some(prefix => value.startsWith(prefix));

const reportIfHardcoded = (context, node, value) => {
  if (isHardcodedInternalUrl(value)) context.report({ node, messageId: "useRoutes" });
};

export default {
  meta: {
    type: "problem",
    docs: { description: "Disallow hard-coded internal navigation URLs outside the central ROUTES object." },
    schema: [],
    messages: { useRoutes: "Dùng ROUTES hoặc helper route thay vì hard-code URL nội bộ." },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (!node.value || !["href", "to"].includes(node.name.name)) return;
        if (node.value.type === "Literal") reportIfHardcoded(context, node.value, node.value.value);
        if (node.value.type === "JSXExpressionContainer" && node.value.expression.type === "Literal") reportIfHardcoded(context, node.value.expression, node.value.expression.value);
      },
      CallExpression(node) {
        const method = node.callee.type === "MemberExpression" && !node.callee.computed && node.callee.property.type === "Identifier" ? node.callee.property.name : null;
        if (!method || !["assign", "replace", "push", "navigate", "setLocation"].includes(method)) return;
        const [argument] = node.arguments;
        if (argument?.type === "Literal") reportIfHardcoded(context, argument, argument.value);
      },
      AssignmentExpression(node) {
        if (node.left.type !== "MemberExpression" || node.left.computed || node.left.property.type !== "Identifier" || node.left.property.name !== "href") return;
        if (node.right.type === "Literal") reportIfHardcoded(context, node.right, node.right.value);
      },
    };
  },
};
