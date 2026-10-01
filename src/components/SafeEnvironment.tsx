"use client";

import React, { Component } from "react";
import { Environment } from "@react-three/drei";

type SafeEnvironmentProps = {
  files: string;
  environmentIntensity?: number;
};

type State = {
  hasError: boolean;
};

export class SafeEnvironment extends Component<SafeEnvironmentProps, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("HDR environment failed to load, falling back to ambient lights:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <group>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 10, 5]} intensity={2} />
          <directionalLight position={[-5, 5, -5]} intensity={1} />
        </group>
      );
    }

    return (
      <Environment
        files={this.props.files}
        environmentIntensity={this.props.environmentIntensity}
      />
    );
  }
}

export default SafeEnvironment;
