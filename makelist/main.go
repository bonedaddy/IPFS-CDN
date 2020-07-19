package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
)

func main() {
	// Open list file
	f, err := os.OpenFile("list.txt", os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalln(err)
	}

	// Keep a domain set
	domains := map[string]bool{}

	// Directories
	dirs, err := ioutil.ReadDir("files/")
	if err != nil {
		log.Fatalln(err)
	}
	for _, dir := range dirs {
		// Domain
		domains[dir.Name()] = true
		fmt.Println("Finished", dir.Name())

		// Files
		err = filepath.Walk("files/"+dir.Name(),
			func(path string, info os.FileInfo, err error) error {
				if err != nil {
					return err
				}
				if info.IsDir() {
					return nil
				}

				// Read file
				out, err := exec.Command("ipfs", "add", path).Output()
				if err != nil {
					log.Println(err)
				}

				qmHash := string(out)[6:52]

				_, err = f.WriteString("'" + path[6:] + "': '" + qmHash + "',")
				if err != nil {
					log.Println(path, err)
				}

				return nil
			})
		if err != nil {
			log.Println(err)
		}
	}

	// Close list file
	f.Close()

	// Open domain list file
	df, err := os.OpenFile("domainList.txt", os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalln(err)
	}

	for domain := range domains {
		_, err = df.WriteString("'*://" + domain + "/*',")
		if err != nil {
			log.Println(err)
		}
	}

	// Close domain list file
	df.Close()
}
