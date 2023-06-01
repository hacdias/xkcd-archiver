package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path"

	"github.com/karlseguin/typed"
	"github.com/spf13/cobra"
)

func main() {
	if err := cmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

}
func init() {
	cmd.Flags().Bool("empty", false, "empty output directory")
}

var cmd = &cobra.Command{
	Use:               "xkcd-archiver output",
	Args:              cobra.ExactArgs(1),
	CompletionOptions: cobra.CompletionOptions{DisableDefaultCmd: true},
	RunE: func(cmd *cobra.Command, args []string) error {
		outputDir := args[0]

		empty, err := cmd.Flags().GetBool("empty")
		if err != nil {
			return err
		}

		if empty {
			err = os.RemoveAll(outputDir)
			if err != nil {
				return err
			}
		}

		err = os.MkdirAll(outputDir, 0744)
		if err != nil {
			return err
		}

		latest, err := getLatestID()
		if err != nil {
			return err
		}

		log.Println("Latest comic ID is", latest)

		// let added = []
		// const errored = []
		// let latest = null

		for i := 1; i <= latest; i++ {
			// Comic 404 does not exist.
			if i == 404 {
				continue
			}

			num := fmt.Sprintf("%04d", i)
			comicDir := path.Join(outputDir, num)

			_, err := os.Stat(comicDir)
			fmt.Println(err, os.IsNotExist(err))
			if os.IsNotExist(err) {
				info, img, err := getComic(i)
				if err != nil {
					//  errored.push(info)
					return nil
				}
				err = writeComic(info, img, comicDir)
				if err != nil {
					return nil
				}

				// 		const info = {
				// 			id: i,
				// 			dir: dir,
				// 			num: num
				// 		}
				// added.push(info)

			} else if err != nil {
				return err
			} else {
				// const data = await fs.readJSON(join(dir, 'info.json'))
				// added.push({ id: i, title: data.title, num })
				// await fs.outputFile(join(dir, 'index.html'), comicPage(data, latest))
			}
		}

		// for (const info of errored) {
		// 	const { id, dir, num } = info
		// 	for (let i = 0; i < 3; i++) {
		// 		try {
		// 			const comic = await getComic(id)
		// 			await write(comic, dir, latest)
		// 			added.push(info)
		// 			break
		// 		} catch (err) {
		// 			if (i === 2) {
		// 				console.log(`😢 ${num} could not be fetched: ${err.toString()}`)
		// 			}
		// 		}
		// 	}
		// }

		// if (errored.length === 0) {
		// 	progress('📦 All comics fetched\n')
		// } else {
		// 	progress('📦 Some comics fetched\n')
		// }

		// added = added.sort((a, b) => a.num - b.num)
		// await fs.remove(join(argv.dir, 'latest'))
		// await fs.copy(join(argv.dir, pad(latest, 4)), join(argv.dir, 'latest'))
		// await fs.copyFile(join(require.resolve('tachyons'), '../tachyons.min.css'), join(argv.dir, 'tachyons.css'))
		// await fs.copyFile(join(require.resolve('tachyons-columns'), '../../css/tachyons-columns.min.css'), join(argv.dir, 'tachyons-columns.css'))
		// await fs.outputFile(join(argv.dir, 'index.html'), homePage(added))

		return nil
	},
}

func writeComic(info typed.Typed, img []byte, directory string) error {
	err := os.MkdirAll(directory, 0744)
	if err != nil {
		return err
	}

	infoRaw, err := json.MarshalIndent(info, "", "  ")
	if err != nil {
		return err
	}

	err = os.WriteFile(path.Join(directory, "info.json"), infoRaw, 0666)
	if err != nil {
		return err
	}

	// TODO: make index.html

	if img != nil {
		imgExtension := path.Ext(info.String("img"))
		err = os.WriteFile(path.Join(directory, "image"+imgExtension), img, 0666)
		if err != nil {
			return err
		}
	}

	return nil
}
