package main

import (
    "encoding/json"
    "io/ioutil"
    "net/http"
)

type TextData struct {
    NamaText string `json:"nama_text"`
    IsiText  string `json:"isi_text"`
}

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        http.ServeFile(w, r, "index.html")
    })
    http.HandleFunc("/submit", func(w http.ResponseWriter, r *http.Request) {
        var data TextData
        err := json.NewDecoder(r.Body).Decode(&data)
        if err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        ioutil.WriteFile(data.NamaText, []byte(data.IsiText), 0644)
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"success": true}`))
    })
    http.ListenAndServe(":8000", nil)
}