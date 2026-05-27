{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = with pkgs; [
    jdk17
    maven
    nodejs_22
    docker-compose

    git
    jq
    ripgrep
  ];

  shellHook = ''
    export JAVA_HOME="${pkgs.jdk17}/lib/openjdk"
    echo "PSK-Elitas dev shell ready"
    echo "  Java: $(java -version 2>&1 | head -1)"
    echo "  Node: $(node -v)"
  '';
}
