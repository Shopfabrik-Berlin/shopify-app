{
  inputs = {
    devshell.url = "github:numtide/devshell";
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, devshell, flake-utils, nixpkgs }:
    let overlay = _: prev: { nodejs = prev.nodejs-16_x; };

    in flake-utils.lib.simpleFlake {
      inherit self nixpkgs;

      name = "shopify-app";
      preOverlays = [ devshell.overlay overlay ];
      systems = flake-utils.lib.defaultSystems;

      shell = { pkgs }:
        pkgs.devshell.mkShell {
          motd = "";
          packages = with pkgs; [ nodejs ] ++ (with nodePackages; [ pnpm ]);
        };
    };
}
