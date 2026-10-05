"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  fallback: (retry: () => void) => ReactNode;
  onRetry?: () => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Keeps a failing 3D canvas from taking the rest of the page down with it. */
export class ViewerErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "[anatomy-viewer] 3D viewer crashed:",
      error,
      info.componentStack,
    );
  }

  private readonly retry = () => {
    this.props.onRetry?.();
    this.setState({ error: null });
  };

  override render() {
    return this.state.error
      ? this.props.fallback(this.retry)
      : this.props.children;
  }
}
