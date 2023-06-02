package main

import (
	"bytes"
	"embed"
	"fmt"
	"html/template"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"sort"

	"github.com/spf13/cobra"
)

const (
	dirPermissions  fs.FileMode = 0744
	filePermissions fs.FileMode = 0666
)

var (
	//go:embed assets/*
	assets embed.FS
)

func init() {
	cmd.Flags().Bool("empty", false, "empty output directory")
	cmd.Flags().Bool("skip-html", false, "do not generate HTML files")
	cmd.Flags().UintP("from", "f", 1, "first comic to download")
	cmd.Flags().UintP("to", "t", 0, "last comic to download")
}

func main() {
	if err := cmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

var cmd = &cobra.Command{
	Use:  "xkcd-archiver output",
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		empty, _ := cmd.Flags().GetBool("empty")
		skipHTML, _ := cmd.Flags().GetBool("skip-html")
		from, _ := cmd.Flags().GetUint("from")
		to, _ := cmd.Flags().GetUint("to")
		out := args[0]

		latest, err := getLatestID()
		if err != nil {
			return err
		}
		log.Printf("Latest comic is %d.\n", latest)

		if from == 0 {
			from = 1
		}

		if to == 0 {
			to = uint(latest)
		}

		if empty {
			err := os.RemoveAll(out)
			if err != nil {
				return err
			}
		}

		err = os.MkdirAll(out, dirPermissions)
		if err != nil {
			return err
		}

		log.Printf("Downloading comics from %d to %d.\n", from, to)

		comicTemplate, err := getTemplate("comic")
		if err != nil {
			return err
		}

		homeTemplate, err := getTemplate("home")
		if err != nil {
			return err
		}

		homeData := &homeData{}

		for id := from; id <= to; id++ {
			if id == 404 {
				// Comic 404 does not exist.
				continue
			}

			log.Printf("Downloading comic %d.\n", id)

			comicDir := filepath.Join(out, fmt.Sprintf("%d", id))
			metadata, err := getComic(comicDir, id)
			if err != nil {
				return err
			}

			data := &comicData{
				Num:    id,
				Title:  metadata.String("title"),
				Alt:    metadata.String("alt"),
				Image:  metadata.String("img"),
				Latest: latest,
			}

			var b bytes.Buffer
			err = comicTemplate.Execute(&b, data)
			if err != nil {
				return err
			}
			err = os.WriteFile(filepath.Join(comicDir, "index.html"), b.Bytes(), filePermissions)
			if err != nil {
				return err
			}

			homeData.Comics = append(homeData.Comics, data)
		}

		if !skipHTML {
			sort.Slice(homeData.Comics, func(i, j int) bool {
				return homeData.Comics[i].Num > homeData.Comics[j].Num
			})

			var b bytes.Buffer
			err = homeTemplate.Execute(&b, homeData)
			if err != nil {
				return err
			}
			err = os.WriteFile(filepath.Join(out, "index.html"), b.Bytes(), filePermissions)
			if err != nil {
				return err
			}

			err = copyAsset(out, "styles.css")
			if err != nil {
				return err
			}

			err = copyAsset(out, "favicon.ico")
			if err != nil {
				return err
			}
		}

		log.Println("Comics fetched.")
		return nil
	},
}

type comicData struct {
	Latest uint
	Num    uint
	Title  string
	Alt    string
	Image  string
}

type homeData struct {
	Comics []*comicData
}

func getTemplate(name string) (*template.Template, error) {
	comicBytes, err := assets.ReadFile("assets/" + name + ".html")
	if err != nil {
		return nil, err
	}
	return template.New("").Funcs(template.FuncMap{
		"minus": func(a, b uint) uint {
			return a - b
		},
		"plus": func(a, b uint) uint {
			return a + b
		},
	}).Parse(string(comicBytes))
}

func copyAsset(out, filename string) error {
	data, err := assets.ReadFile("assets/" + filename)
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(out, filename), data, filePermissions)
}
