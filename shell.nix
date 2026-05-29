{ pkgs ? import <nixpkgs> {} }:

let
  start = pkgs.writeShellScriptBin "start" ''
    set -e
    docker-compose up -d postgres
    [ -d auth-server/node_modules ] || ( cd auth-server && npm install )
    [ -d frontend/node_modules ]    || ( cd frontend && npm install )
    trap "kill 0" EXIT
    ( cd backend && ./mvnw -Dmaven.test.skip=true spring-boot:run ) &
    ( cd auth-server && npm run dev ) &
    ( cd frontend && npm run dev ) &
    wait
  '';

  fresh = pkgs.writeShellScriptBin "fresh" ''
    set -e
    echo "wiping stale build artifacts + deps..."
    rm -rf backend/target frontend/node_modules frontend/dist auth-server/node_modules
    ( cd auth-server && npm install )
    ( cd frontend && npm install )
    ( cd backend && ./mvnw -q clean compile )
    echo "clean build done, launching..."
    exec start
  '';

  report = pkgs.writeShellScriptBin "report" ''
    set -e
    typst compile requirement_implementations/technine-ataskaita.typ \
                  requirement_implementations/technine-ataskaita.pdf
    echo "wrote requirement_implementations/technine-ataskaita.pdf"
  '';
in
pkgs.mkShell {
  packages = with pkgs; [
    jdk17
    maven
    nodejs_22
    docker-compose

    git
    jq
    ripgrep

    typst
    poppler-utils

    start
    fresh
    report
  ];

  shellHook = ''
    export JAVA_HOME="${pkgs.jdk17}/lib/openjdk"
    echo "PSK-Elitas dev shell ready"
    echo "  Java: $(java -version 2>&1 | head -1)"
    echo "  Node: $(node -v)"
    echo ""
    echo "  fresh  -> wipe stale target/node_modules, reinstall, recompile, then launch"
    echo "  start  -> just bring up postgres + backend + auth + frontend"
    echo "  report -> compile the 2-page technical report to requirement_implementations/technine-ataskaita.pdf"
  '';
}
