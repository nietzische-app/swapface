import { mockSwapProvider } from "@/services/face-swap/mock-provider";
import { reactorAdapter } from "@/services/face-swap/reactor-adapter";
import type { SwapProvider } from "@/services/face-swap/types";

export function getSwapProvider(): SwapProvider {
  if (process.env.REACTOR_API_URL) return reactorAdapter;
  return mockSwapProvider;
}
