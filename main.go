package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:            "nodz",
		Width:            1400,
		Height:           768,
		AssetServer:      &assetserver.Options{Assets: assets},
		BackgroundColour: &options.RGBA{R: 11, G: 12, B: 16, A: 255},
		OnStartup:        app.startup,
		Bind:             []interface{}{app},
		DisableResize:    false,
		Mac: &mac.Options{
			// Hides the native title bar background but keeps the traffic-light
			// buttons, so move/minimise/maximise/close all work without any
			// custom window-chrome code, and no OS-drawn border clashes with
			// the app's own dark theme.
			TitleBar:             mac.TitleBarHiddenInset(),
			Appearance:           mac.NSAppearanceNameDarkAqua,
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
