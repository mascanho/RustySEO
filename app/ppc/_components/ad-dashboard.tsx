// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { AdForm } from "./ad-form";
import { AdList } from "./ad-list";
import { AdPreview } from "./ad-preview";
import { DashboardHeader } from "./dashboard-header";
import { DashboardLayout } from "./dashboard-layout";
import { toast } from "./hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdDashboard() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [sidebarView, setSidebarView] = useState<string>("dashboard");

  // Function to save ads to localStorage
  const saveAdsToLocalStorage = (ads) => {
    localStorage.setItem("ads", JSON.stringify(ads));
  };

  // Function to retrieve ads from localStorage
  const getAdsFromLocalStorage = () => {
    const ads = localStorage.getItem("ads");
    return ads ? JSON.parse(ads) : [];
  };

  useEffect(() => {
    const handleClearSelectedAd = () => {
      setSelectedAd(null);
    };

    window.addEventListener("clearSelectedAd", handleClearSelectedAd);

    // Load ads from localStorage when the component mounts
    const savedAds = getAdsFromLocalStorage();
    if (savedAds.length > 0) {
      const processedAds = savedAds.map(ad => ({
        ...ad,
        headlines: Array.isArray(ad.headlines) ? ad.headlines : (typeof ad.headlines === 'string' ? ad.headlines.split('\n') : []),
        descriptions: Array.isArray(ad.descriptions) ? ad.descriptions : (typeof ad.descriptions === 'string' ? ad.descriptions.split('\n') : []),
        keywords: Array.isArray(ad.keywords) ? ad.keywords : (typeof ad.keywords === 'string' ? ad.keywords.split('\n') : []),
      }));
      setAds(processedAds);
      setSelectedAd(processedAds[0]);
    }

    return () => {
      window.removeEventListener("clearSelectedAd", handleClearSelectedAd);
    };
  }, []);

  const handleAddAd = () => {
    const newAd = {
      id: Date.now().toString(),
      name: "New Ad",
      type: "search", // Default type
      headlines: [""],
      descriptions: [""],
      keywords: [],
      finalUrl: "",
      displayPath: "",
      sitelinks: [],
    };
    const updatedAds = [...ads, newAd];
    setAds(updatedAds);
    setSelectedAd(newAd);
    setSidebarView("ads");
    saveAdsToLocalStorage(updatedAds); // Save to localStorage

    toast({
      title: "Ad created",
      description: `"${newAd.name}" has been created successfully`,
    });
  };

  const handleCloneAd = (ad) => {
    // Clone sitelinks with new IDs
    const clonedSitelinks = ad.sitelinks
      ? ad.sitelinks.map((sitelink) => ({
        ...sitelink,
        id: Date.now() + Math.random().toString(36).substring(2, 9),
      }))
      : [];

    const clonedAd = {
      ...ad,
      id: Date.now().toString(),
      name: `${ad.name} (Copy)`,
      sitelinks: clonedSitelinks,
    };
    const updatedAds = [...ads, clonedAd];
    setAds(updatedAds);
    setSelectedAd(clonedAd);
    setSidebarView("ads");
    saveAdsToLocalStorage(updatedAds); // Save to localStorage

    toast.info({
      title: "Ad cloned",
      description: `"${ad.name}" has been cloned successfully`,
    });
  };

  const handleSelectAd = (ad) => {
    const processedAd = {
      ...ad,
      headlines: Array.isArray(ad.headlines) ? ad.headlines : (typeof ad.headlines === 'string' ? ad.headlines.split('\n') : []),
      descriptions: Array.isArray(ad.descriptions) ? ad.descriptions : (typeof ad.descriptions === 'string' ? ad.descriptions.split('\n') : []),
      keywords: Array.isArray(ad.keywords) ? ad.keywords : (typeof ad.keywords === 'string' ? ad.keywords.split('\n') : []),
      sitelinks: Array.isArray(ad.sitelinks) ? ad.sitelinks : [],
    };
    setSelectedAd(processedAd);
    setSidebarView("ads");
  };

  const handleDeleteAd = (adId) => {
    try {
      console.log("Delete function called with ID:", adId);

      // Find the ad to be deleted
      const adToDelete = ads.find((ad) => ad.id === adId);

      if (!adToDelete) {
        console.error("Ad not found:", adId);
        return;
      }

      // Create a new array without the deleted ad
      const updatedAds = ads.filter((ad) => ad.id !== adId);

      console.log("Updated ads array:", updatedAds);

      // Update state with the new array
      setAds(updatedAds);
      saveAdsToLocalStorage(updatedAds); // Save to localStorage

      // If we're deleting the currently selected ad, update selectedAd
      if (selectedAd?.id === adId) {
        if (updatedAds.length > 0) {
          setSelectedAd(updatedAds[0]);
        } else {
          setSelectedAd(null);
        }
      }

      console.log("Saving Ad");

      // Show success toast
      toast({
        title: "Ad deleted",
        description: adToDelete
          ? `"${adToDelete.name}" has been deleted`
          : "Ad has been deleted",
        variant: "success",
      });

      console.log("Delete operation completed");
    } catch (error) {
      console.error("Error deleting ad:", error);

      toast({
        title: "Error",
        description: "Failed to delete ad. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAd = (updatedAd) => {
    const updatedAds = ads.map((ad) =>
      ad.id === updatedAd.id ? updatedAd : ad,
    );
    setAds(updatedAds);
    setSelectedAd(updatedAd);
    saveAdsToLocalStorage(updatedAds); // Save to localStorage

    toast({
      title: "Ad saved",
      description: `"${updatedAd.name}" has been saved successfully`,
      variant: "success",
    });
  };

  const handleImportAds = (importedAds) => {
    // Add type if missing in imported ads
    const processedAds = importedAds.map((ad) => ({
      ...ad,
      type: ad.type || "search", // Default to search if type is missing
      sitelinks: ad.sitelinks || [], // Ensure sitelinks exists
    }));

    // Merge imported ads with existing ads, avoiding duplicates by ID
    const existingIds = new Set(ads.map((ad) => ad.id));
    const newAds = processedAds.filter((ad) => !existingIds.has(ad.id));
    const updatedAds = [...ads, ...newAds];

    setAds(updatedAds);
    saveAdsToLocalStorage(updatedAds); // Save to localStorage

    if (newAds.length > 0 && !selectedAd) {
      setSelectedAd(newAds[0]);
    }
  };

  const renderContent = () => {
    switch (sidebarView) {
      case "ads":
        return selectedAd ? (
          <div className="w-full flex flex-col lg:flex-row gap-6 h-full bg-gray-50/20 dark:bg-transparent rounded-2xl overflow-hidden">
            {/* Optimized Editor Column */}
            <div className="w-full lg:w-[650px] xl:w-[750px] flex-shrink-0 h-full flex flex-col">
              <div className="flex-1 flex flex-col bg-white dark:bg-brand-darker/60 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-white/5 shadow-sm overflow-hidden">
                <div className="flex-shrink-0 p-6 pb-0">
                  <div className="mb-6 pb-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
                          onClick={() => setSelectedAd(null)}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ad Editor</h3>
                      </div>
                      <p className="text-sm text-muted-foreground ml-11">Refine your headlines, descriptions and assets</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg font-semibold border-gray-200 dark:border-white/10"
                        onClick={() => setSidebarView("previews")}
                      >
                        Preview Studio
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-0 px-6 pb-6">
                  <div className="h-full">
                    <AdForm
                      ad={selectedAd}
                      onSave={handleSaveAd}
                      onPreview={() => setSidebarView("previews")}
                      onChange={(updatedAd) => {
                        setSelectedAd(updatedAd);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Flexible Preview Column - Full Height */}
            <div className="flex-1 h-full overflow-hidden">
              <AdPreview
                ad={selectedAd}
                allAds={ads}
                onSelectAd={setSelectedAd}
                isLive={true}
              />
            </div>
          </div>
        ) : (
          <AdList
            ads={ads}
            onSelect={handleSelectAd}
            onClone={handleCloneAd}
            onDelete={handleDeleteAd}
          />
        );
      case "previews":
        return (
          <AdPreview
            ad={selectedAd || (ads.length > 0 ? ads[0] : null)}
            allAds={ads}
            onSelectAd={setSelectedAd}
          />
        );
      case "dashboard":
      default:
        return (
          <AdList
            ads={ads}
            onSelect={handleSelectAd}
            onClone={handleCloneAd}
            onDelete={handleDeleteAd}
          />
        );
    }
  };

  const getHeaderTitle = () => {
    switch (sidebarView) {
      case "ads":
        return selectedAd ? "Edit Ad" : "All Ads";
      case "previews":
        return "Ad Previews";
      case "settings":
        return "Settings";
      // case "help":
      //   return "";
      case "dashboard":
      default:
        return "Dashboard";
    }
  };

  const getHeaderDescription = () => {
    switch (sidebarView) {
      case "ads":
        return selectedAd
          ? "Edit your ad details"
          : "Manage your Google search ads";
      case "previews":
        return "Preview how your ads will appear";
      case "settings":
        return "Configure your account settings";
      // case "help":
      //   return "Get help with using the platform";
      case "dashboard":
      default:
        return "Overview of your Google search ads";
    }
  };

  return (
    <DashboardLayout
      onAddNew={handleAddAd}
      activeView={sidebarView}
      onViewChange={setSidebarView}
    >
      <div className="w-full h-full flex flex-col p-4 md:p-6 min-h-0 overflow-hidden">
        {!(sidebarView === "previews" || (sidebarView === "ads" && selectedAd)) && (
          <div className="flex-shrink-0 mb-6">
            <DashboardHeader
              heading={getHeaderTitle()}
              description={getHeaderDescription()}
              onAddNew={
                sidebarView === "dashboard" ||
                  (sidebarView === "ads" && !selectedAd)
                  ? handleAddAd
                  : undefined
              }
              showBackButton={sidebarView === "ads" && selectedAd !== null}
              onBack={() => {
                setSelectedAd(null);
              }}
              ads={ads}
              onImport={handleImportAds}
              showImportExport={
                sidebarView === "dashboard" ||
                (sidebarView === "ads" && !selectedAd)
              }
            />
          </div>
        )}

        <div className="flex-1 min-h-0">
          {renderContent()}
        </div>
      </div>
    </DashboardLayout>
  );
}
