package main

import (
    "encoding/json"
    "os"
    "net/http"
)

type TextData struct {
    NamaText string `json:"nama_text"`
    IsiText  string `json:"isi_text"`
}

func serveFile(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "index.html")
}

func submit(w http.ResponseWriter, r *http.Request) {
    var data TextData
    err := json.NewDecoder(r.Body).Decode(&data)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    os.WriteFile(data.NamaText, []byte(data.IsiText), 0644)
    w.Header().Set("Content-Type", "application/json")
    w.Write([]byte(`{"success": true}`))
}

func main() {
    http.HandleFunc("/", serveFile)
    http.HandleFunc("/submit", submit)
    http.ListenAndServe(":9096", nil)
}
