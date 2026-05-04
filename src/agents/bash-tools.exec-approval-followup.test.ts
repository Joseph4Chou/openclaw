import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./tools/gateway.js", () => ({
  callGatewayTool: vi.fn(async () => ({ ok: true })),
}));

vi.mock("../infra/outbound/message.js", () => ({
  sendMessage: vi.fn(async () => ({ ok: true })),
}));

import { sendMessage } from "../infra/outbound/message.js";
import { sendExecApprovalFollowup } from "./bash-tools.exec-approval-followup.js";
import { callGatewayTool } from "./tools/gateway.js";

afterEach(() => {
  vi.resetAllMocks();
});

describe("exec approval followup", () => {
  it("drops followups when no external route is available", async () => {
    await expect(
      sendExecApprovalFollowup({
        approvalId: "req-1",
        sessionKey: "agent:main:main",
        resultText: "Exec completed: echo ok",
      }),
    ).resolves.toBe(false);

    expect(callGatewayTool).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it.each([
    {
      channel: "slack",
      sessionKey: "agent:main:slack:channel:C123",
      to: "channel:C123",
      accountId: "default",
      threadId: "1712419200.1234",
    },
    {
      channel: "discord",
      sessionKey: "agent:main:discord:channel:123",
      to: "123",
      accountId: "default",
      threadId: "456",
    },
    {
      channel: "telegram",
      sessionKey: "agent:main:telegram:-100123",
      to: "-100123",
      accountId: "default",
      threadId: "789",
    },
  ])("sends direct followups for $channel when an external route exists", async (target) => {
    await sendExecApprovalFollowup({
      approvalId: `req-${target.channel}`,
      sessionKey: target.sessionKey,
      turnSourceChannel: target.channel,
      turnSourceTo: target.to,
      turnSourceAccountId: target.accountId,
      turnSourceThreadId: target.threadId,
      resultText: "slack exec approval smoke",
    });

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: target.channel,
        to: target.to,
        accountId: target.accountId,
        threadId: target.threadId,
        content: "slack exec approval smoke",
        idempotencyKey: `exec-approval-followup:req-${target.channel}`,
      }),
    );
    expect(callGatewayTool).not.toHaveBeenCalled();
  });

  it("falls back to sanitized direct external delivery only when no session exists", async () => {
    await sendExecApprovalFollowup({
      approvalId: "req-no-session",
      turnSourceChannel: "discord",
      turnSourceTo: "123",
      turnSourceAccountId: "default",
      turnSourceThreadId: "456",
      resultText: "Exec finished (gateway id=req-no-session, session=sess_1, code 0)\nall good",
    });

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "discord",
        to: "123",
        accountId: "default",
        threadId: "456",
        content: "all good",
        idempotencyKey: "exec-approval-followup:req-no-session",
      }),
    );
    expect(callGatewayTool).not.toHaveBeenCalled();
  });

  it("can force direct delivery even when a session key exists", async () => {
    await sendExecApprovalFollowup({
      approvalId: "req-direct",
      sessionKey: "agent:main:telegram:direct:123",
      turnSourceChannel: "telegram",
      turnSourceTo: "123",
      turnSourceAccountId: "default",
      resultText:
        "Exec finished (gateway id=req-direct, session=sess_1, code 0)\npasteable diagnostics report",
      direct: true,
    });

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "telegram",
        to: "123",
        accountId: "default",
        content: "pasteable diagnostics report",
        idempotencyKey: "exec-approval-followup:req-direct",
      }),
    );
    expect(callGatewayTool).not.toHaveBeenCalled();
  });

  it("sends sanitized direct delivery for successful completions even with a session key", async () => {
    await sendExecApprovalFollowup({
      approvalId: "req-session-resume-failed",
      sessionKey: "agent:main:discord:channel:123",
      turnSourceChannel: "discord",
      turnSourceTo: "123",
      turnSourceAccountId: "default",
      turnSourceThreadId: "456",
      resultText:
        "Exec finished (gateway id=req-session-resume-failed, session=sess_1, code 0)\nall good",
    });

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "all good",
        idempotencyKey: "exec-approval-followup:req-session-resume-failed",
      }),
    );
    expect(callGatewayTool).not.toHaveBeenCalled();
  });

  it("uses a generic summary when a no-session completion has no user-visible output", async () => {
    await sendExecApprovalFollowup({
      approvalId: "req-no-session-empty",
      turnSourceChannel: "discord",
      turnSourceTo: "123",
      turnSourceAccountId: "default",
      turnSourceThreadId: "456",
      resultText: "Exec finished (gateway id=req-no-session-empty, session=sess_2, code 0)",
    });

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Background command finished.",
        idempotencyKey: "exec-approval-followup:req-no-session-empty",
      }),
    );
  });

  it("uses safe denied copy when a routed session followup is sent directly", async () => {
    await sendExecApprovalFollowup({
      approvalId: "req-denied-resume-failed",
      sessionKey: "agent:main:telegram:-100123",
      turnSourceChannel: "telegram",
      turnSourceTo: "-100123",
      turnSourceAccountId: "default",
      turnSourceThreadId: "789",
      resultText: "Exec denied (gateway id=req-denied-resume-failed, approval-timeout): uname -a",
    });

    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "Command did not run: approval timed out.",
        idempotencyKey: "exec-approval-followup:req-denied-resume-failed",
      }),
    );
    expect(callGatewayTool).not.toHaveBeenCalled();
  });

  it("suppresses denied followups for subagent sessions", async () => {
    await expect(
      sendExecApprovalFollowup({
        approvalId: "req-denied-subagent",
        sessionKey: "agent:main:subagent:test",
        turnSourceChannel: "telegram",
        turnSourceTo: "123",
        turnSourceAccountId: "default",
        resultText: "Exec denied (gateway id=req-denied-subagent, approval-timeout): uname -a",
      }),
    ).resolves.toBe(false);

    expect(callGatewayTool).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it.each([
    "Exec denied (gateway id=req-denied-nosession, approval-timeout): uname -a",
    "exec denied (gateway id=req-denied-nosession, approval-timeout): uname -a",
  ])("does not mirror raw denied followups without a session: %s", async (resultText) => {
    await expect(
      sendExecApprovalFollowup({
        approvalId: "req-denied-nosession",
        turnSourceChannel: "telegram",
        turnSourceTo: "123",
        turnSourceAccountId: "default",
        resultText,
      }),
    ).resolves.toBe(false);

    expect(callGatewayTool).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("does not resume routed sessions when no deliverable route exists", async () => {
    await expect(
      sendExecApprovalFollowup({
        approvalId: "req-elevated-74646",
        sessionKey: "agent:main:telegram:-100123",
        turnSourceChannel: "telegram",
        resultText: "Exec completed: systemctl status gateway",
      }),
    ).resolves.toBe(false);

    expect(callGatewayTool).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("returns false when neither a session nor a deliverable route is available", async () => {
    await expect(
      sendExecApprovalFollowup({
        approvalId: "req-missing",
        turnSourceChannel: "slack",
        resultText: "Exec completed: echo ok",
      }),
    ).resolves.toBe(false);
  });
});
