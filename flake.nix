{
  description = "Study Flow development shell (Next.js + Tauri)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            rustc
            cargo
            rust-analyzer
            pkg-config
            gcc
            glib
            gtk3
            webkitgtk_4_1
            libsoup_3
            openssl
          ];

          # Helps crates find system headers and libs during build.
          PKG_CONFIG_PATH = "${pkgs.openssl.dev}/lib/pkgconfig";
          OPENSSL_DIR = "${pkgs.openssl.dev}";

          shellHook = ''
            export PS1="\[\e[1;35m\]\u [ \[\e[0m\]\w\[\e[1;35m\] ]\$ \[\e[0m\]"
          '';
        };
      });
}
