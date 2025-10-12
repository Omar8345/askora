import { Github, Heart, Mail, Star } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border/60 bg-gradient-to-br from-background/98 via-card/50 to-background/95 backdrop-blur-lg">
      {/* Enhanced Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border/80 to-transparent"></div>
        <div className="absolute top-0 left-1/3 w-64 h-64 bg-[#7c3aed]/4 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/3 w-80 h-80 bg-[#1A8596]/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-[#f472b6]/3 to-[#1A8596]/3 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background/20 to-transparent"></div>
      </div>

      <div className="relative px-4 py-20">
        <div className="container mx-auto max-w-7xl">
          {/* Main Footer Content */}
          <div className="grid gap-16 lg:grid-cols-3 md:grid-cols-2">
            {/* Brand Section - Enhanced */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-[#1A8596] bg-clip-text text-transparent">
                    Askora
                  </h2>
                  <p className="text-sm text-muted-foreground/90 font-medium tracking-wide">
                    AI-POWERED ONBOARDING PLATFORM
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-base leading-relaxed text-muted-foreground max-w-xl">
                  Transforming how developers contribute to open source. Our AI-powered platform
                  makes complex repositories accessible, turning barriers into bridges for
                  collaboration and innovation.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href="https://github.com/Omar8345/askora"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-muted/60 to-muted/40 hover:from-muted hover:to-muted/80 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <Github className="h-5 w-5 transition-transform duration-300" />
                    <span className="font-medium">Star on GitHub</span>
                    <Star className="h-4 w-4 opacity-60 group-hover:opacity-100 group-hover:fill-yellow-400 group-hover:text-yellow-400 transition-all duration-300" />
                  </a>

                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/20 border border-border/30">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground font-medium">Open Source</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Connect Section - Enhanced */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#1A8596]/20 to-[#1A8596]/10 border border-[#1A8596]/20">
                    <Mail className="h-4 w-4 text-[#1A8596]" />
                  </div>
                  Let's Connect
                </h4>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Questions, feedback, or collaboration ideas?
                  <br />
                  We're here to help build the future of open source together.
                </p>
              </div>

              <div className="space-y-4">
                <a
                  href="mailto:hello@askora.dev"
                  className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-card/60 to-card/30 hover:from-card hover:to-card/80 border border-border/40 hover:border-[#1A8596]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#1A8596]/5"
                >
                  <div className="p-2 rounded-lg bg-[#1A8596]/10 group-hover:bg-[#1A8596]/20 transition-colors duration-300">
                    <Mail className="h-4 w-4 text-[#1A8596] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground group-hover:text-[#1A8596] transition-colors duration-300">
                      hello@askora.dev
                    </span>
                    <p className="text-xs text-muted-foreground">Drop us a line</p>
                  </div>
                </a>

                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-[#1A8596]/5 border border-primary/10">
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">
                    💡 <strong>Contributing?</strong> Check our GitHub issues or reach out for
                    guidance on getting started.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-16 pt-8 border-t border-border/50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Copyright */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  Made with <Heart className="h-4 w-4 fill-red-500 text-red-500 animate-pulse" />
                  by developers for developers
                </p>
              </div>

              {/* Powered By */}
              <a
                href="https://mindsdb.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 px-4 py-2 rounded-full bg-transparent hover:bg-[#1A8596]/10 text-sm text-[#1A8596] transition-all duration-500 hover:scale-105 relative overflow-hidden border border-[#1A8596]/30"
              >
                <span className="relative z-10 text-[#1A8596] font-semibold">Powered by</span>
                <img
                  src="/mindsdb-logo-horizontal-dark.svg"
                  alt="MindsDB Logo"
                  className="h-4 w-auto relative z-10"
                />
                <div className="absolute inset-0 bg-[#1A8596]/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                <div className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#1A8596] transition-all duration-500 ease-out group-hover:w-full"></div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
