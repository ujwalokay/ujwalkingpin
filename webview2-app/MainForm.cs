using System;
using System.IO;
using System.Windows.Forms;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;

namespace AiravotoGamingPOS
{
    public partial class MainForm : Form
    {
        private WebView2 webView;
        private bool isInitialized = false;

        public MainForm()
        {
            InitializeComponent();
            InitializeWebViewAsync();
        }

        private void InitializeComponent()
        {
            this.SuspendLayout();
            
            // Form settings
            this.Text = "Airavoto Gaming POS";
            this.Size = new System.Drawing.Size(1400, 900);
            this.MinimumSize = new System.Drawing.Size(1024, 768);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.WindowState = FormWindowState.Maximized;
            this.BackColor = System.Drawing.Color.FromArgb(17, 17, 27); // Dark background matching app
            
            // WebView2 control
            this.webView = new WebView2();
            this.webView.Dock = DockStyle.Fill;
            this.webView.BackColor = System.Drawing.Color.FromArgb(17, 17, 27);
            
            this.Controls.Add(this.webView);
            this.ResumeLayout(false);
        }

        private async void InitializeWebViewAsync()
        {
            try
            {
                string appDir = AppDomain.CurrentDomain.BaseDirectory;
                
                // Path to bundled WebView2 runtime (fixed version for offline use)
                string webView2RuntimePath = Path.Combine(appDir, "WebView2Runtime");
                
                // User data folder for WebView2 cache/settings
                string userDataFolder = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "AiravotoGamingPOS",
                    "WebView2Data"
                );

                CoreWebView2EnvironmentOptions options = new CoreWebView2EnvironmentOptions();
                
                CoreWebView2Environment env;
                
                // Try to use bundled runtime first, fall back to system-installed
                if (Directory.Exists(webView2RuntimePath) && 
                    Directory.GetFiles(webView2RuntimePath, "*.dll", SearchOption.AllDirectories).Length > 0)
                {
                    env = await CoreWebView2Environment.CreateAsync(
                        webView2RuntimePath, 
                        userDataFolder, 
                        options
                    );
                }
                else
                {
                    // Fall back to system-installed WebView2 runtime
                    env = await CoreWebView2Environment.CreateAsync(
                        null, 
                        userDataFolder, 
                        options
                    );
                }

                await webView.EnsureCoreWebView2Async(env);
                
                // Configure WebView2 settings
                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
                webView.CoreWebView2.Settings.IsZoomControlEnabled = false;
                webView.CoreWebView2.Settings.AreDevToolsEnabled = false; // Disable in production
                
                // Set up virtual host for local files (more secure than file:// protocol)
                string wwwrootPath = Path.Combine(appDir, "wwwroot");
                
                if (Directory.Exists(wwwrootPath))
                {
                    webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                        "app.local",
                        wwwrootPath,
                        CoreWebView2HostResourceAccessKind.Allow
                    );
                    
                    // Navigate to local app
                    webView.CoreWebView2.Navigate("https://app.local/index.html");
                }
                else
                {
                    // Show error message if wwwroot folder is missing
                    ShowError("Web application files not found. Please ensure the 'wwwroot' folder exists.");
                }

                isInitialized = true;
            }
            catch (Exception ex)
            {
                ShowError($"Failed to initialize WebView2: {ex.Message}\n\nPlease ensure WebView2 Runtime is installed.");
            }
        }

        private void ShowError(string message)
        {
            MessageBox.Show(
                message,
                "Airavoto Gaming POS - Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (webView != null)
            {
                webView.Dispose();
            }
            base.OnFormClosing(e);
        }
    }
}
