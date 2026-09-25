package com.elsayedaa.app;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.CookieManager;
import android.webkit.MimeTypeMap;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.DownloadListener;
import android.app.Activity;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends Activity {
    private static final String SITE_URL = "https://assemibrahim679-tech.github.io/elsayedaa/?android=1&v=2";
    private WebView webView;
    private final Map<String, String> hostToReciter = new HashMap<>();

    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hostToReciter.put("server11.mp3quran.net", "yasser");
        hostToReciter.put("server10.mp3quran.net", "minsh");
        hostToReciter.put("server8.mp3quran.net", "frs_a");
        hostToReciter.put("server12.mp3quran.net", "maher");
        hostToReciter.put("server13.mp3quran.net", "husary");

        webView = new WebView(this);
        setContentView(webView);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse local = localFatiha(request.getUrl().toString());
                return local != null ? local : super.shouldInterceptRequest(view, request);
            }
        });
        webView.setDownloadListener(new DownloadListener() {
            @Override public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
                req.setMimeType(mimetype != null ? mimetype : "audio/mpeg");
                req.addRequestHeader("User-Agent", userAgent);
                req.setTitle("تحميل تلاوة القرآن");
                req.setDescription("سيتم حفظ الملف للسماع بدون إنترنت");
                req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                req.setDestinationInExternalPublicDir(Environment.DIRECTORY_MUSIC, Uri.parse("Elsayedaa/" + Uri.parse(url).getLastPathSegment()).getPath());
                ((DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(req);
            }
        });
        CookieManager.getInstance().setAcceptCookie(true);
        webView.loadUrl(SITE_URL);
    }

    private WebResourceResponse localFatiha(String url) {
        try {
            Uri uri = Uri.parse(url);
            String reciter = hostToReciter.get(uri.getHost());
            String path = uri.getPath();
            if (path.contains("/ajm/")) reciter = "ahmad_ajmi";
            else if (path.contains("/bna/")) reciter = "banna";
            else if (path.contains("/frs_a/")) reciter = "frs_a";
            if (reciter == null || !uri.getPath().endsWith("/001.mp3")) return null;
            InputStream stream = getAssets().open("quran/" + reciter + "/001.mp3");
            return new WebResourceResponse("audio/mpeg", "binary", stream);
        } catch (IOException ignored) { return null; }
    }

    @Override public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack(); else super.onBackPressed();
    }
}
