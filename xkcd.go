package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/karlseguin/typed"
)

func get(url string) ([]byte, error) {
	res, err := http.DefaultClient.Get(url)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", res.StatusCode)
	}

	data, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func getJSON(url string) (typed.Typed, error) {
	data, err := get(url)
	if err != nil {
		return nil, err
	}

	m, err := typed.Json(data)
	if err != nil {
		return nil, err
	}

	return m, nil
}

func getComicMetadata(id uint) (typed.Typed, error) {
	return getJSON(fmt.Sprintf("https://xkcd.com/%d/info.0.json", id))
}

func getLatestID() (uint, error) {
	m, err := getJSON("https://xkcd.com/info.0.json")
	if err != nil {
		return 0, err
	}

	id, ok := m.IntIf("num")
	if !ok {
		return 0, errors.New("key 'num' does not exist")
	}

	return uint(id), nil
}

func getImage(url string) ([]byte, error) {
	ext := path.Ext(url)
	basename := strings.TrimSuffix(path.Base(url), ext)
	dirname := path.Dir(url)

	data, err := get(fmt.Sprintf("%s/%s_2x%s", dirname, basename, ext))
	if err != nil {
		data, err = get(url)
	}

	return data, err
}

// ensureComic fetches comic #id and stores it in out. Returns metadata.
func ensureComic(out string, id uint) (typed.Typed, error) {
	err := os.MkdirAll(out, dirPermissions)
	if err != nil {
		return nil, err
	}

	metadata, err := getComicMetadata(id)
	if err != nil {
		return nil, err
	}

	// Some comics, such as 1608 and 1663, are composed by interactive
	// games and cannot be downloaded as images, so we just ignore them.
	if imgURL := metadata.StringOr("img", "https://imgs.xkcd.com/comics/"); imgURL != "https://imgs.xkcd.com/comics/" {
		imgBytes, err := getImage(imgURL)
		if err != nil {
			return nil, err
		}

		imgName := path.Base(imgURL)
		err = os.WriteFile(filepath.Join(out, imgName), imgBytes, filePermissions)
		if err != nil {
			return nil, err
		}

		metadata["img"] = "./" + imgName
	}

	infoBytes, err := json.MarshalIndent(metadata, "", "  ")
	if err != nil {
		return nil, err
	}

	err = os.WriteFile(filepath.Join(out, "info.json"), infoBytes, filePermissions)
	if err != nil {
		return nil, err
	}

	return metadata, nil
}

// getComic gets comic #id metadata from out, or fetches from Internet.
func getComic(out string, id uint) (typed.Typed, error) {
	_, err := os.Stat(out)

	if os.IsNotExist(err) {
		return ensureComic(out, id)
	} else if err == nil {
		data, err := os.ReadFile(filepath.Join(out, "info.json"))
		if err != nil {
			return nil, err
		}

		return typed.Json(data)
	}

	return nil, err
}
