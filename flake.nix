{
  description = "Study Flow — Productivity app for focused studying";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShells.default = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [
            cmake
            pkg-config
            python3
            nodejs_22
            pnpm
            rustup
            cargo
            rustc
          ];

          buildInputs = with pkgs; [
            libwebkit2gtk-4_1
            libgtk-3
            libsoup-3
            webkit2gtk-4_1
            gtk3
            libsoup
            glib-networking
            openssl
            dbus
            libadwaita
          ];

          shellHook = ''
            rustup default 1.77

            export PS1="\[\e[1;35m\]\u [ \[\e[0m\]\w\[\e[1;35m\] ]\$ \[\e[0m\]"
          '';
        };
      }
    );

  nixConfig = {
    experimental-features = [ "nix-command" "flakes" ];
  };
}
