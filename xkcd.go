package main

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"path"
	"strings"

	"github.com/karlseguin/typed"
)

func makeRequest(url string) ([]byte, error) {
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

func makeJSONRequest(url string) (typed.Typed, error) {
	data, err := makeRequest("https://xkcd.com/info.0.json")
	if err != nil {
		return nil, err
	}

	m, err := typed.Json(data)
	if err != nil {
		return nil, err
	}

	return m, nil
}

func getLatestID() (int, error) {
	m, err := makeJSONRequest("https://xkcd.com/info.0.json")
	if err != nil {
		return 0, err
	}

	id, ok := m.IntIf("num")
	if !ok {
		return 0, errors.New("key 'num' does not exist")
	}

	return id, nil
}

func getImage(url string) ([]byte, error) {
	ext := path.Ext(url)
	basename := strings.TrimSuffix(path.Base(url), ext)
	dirname := path.Dir(url)

	data, err := makeRequest(fmt.Sprintf("%s/%s_2x%s", dirname, basename, ext))
	if err != nil {
		data, err = makeRequest(url)
	}

	return data, err
}

func getComic(id int) (typed.Typed, []byte, error) {
	data, err := makeJSONRequest(fmt.Sprintf("https://xkcd.com/%d/info.0.json", id))
	if err != nil {
		return nil, nil, err
	}

	var img []byte

	// Some comics, such as 1608 and 1663, are composed by interactive
	// games and cannot be downloaded as images, so we just ignore them.
	if i := data.StringOr("img", "https://imgs.xkcd.com/comics/"); i != "https://imgs.xkcd.com/comics/" {
		img, err = getImage(i)
	}

	if err != nil {
		return nil, nil, err
	}

	return data, img, nil
}
